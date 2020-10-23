pragma solidity ^0.6.0;
import "./interfaces/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/IERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol";
import "https://raw.githubusercontent.com/smartcontractkit/chainlink/master/evm-contracts/src/v0.6/VRFConsumerBase.sol";

contract DrawPool is VRFConsumerBase, ERC721 {
    IERC20 public ticketBuyToken;
    uint256 public ticketPrice;
    uint256 public ticketNumber;
    uint256 public drawInterval;
    uint256 public drawCount;
    uint256 public poolStartTime;
    uint256 public ticketBuyEndTime;
    uint256 internal nextDrawTimestamp;
    address internal poolWinner;

    bytes32 internal keyHash;
    uint256 internal fee;

    event NewBuy(address buyer, uint256 ticketNumber);

    mapping(uint256 => uint256) internal drawResult;
    mapping(uint256 => bool) internal alreadyDrawResult;

    constructor(
        string memory _name,
        string memory _symbol,
        address _ticketBuyToken,
        uint256 _ticketBuyPrice,
        uint256 _drawInterval,
        uint256 _ticketBuyDuration,
        string memory _tokenURI
    )
        public
        VRFConsumerBase(
            0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9, // VRF Coordinator
            0xa36085F69e2889c224210F603D836748e7dC0088 // LINK Token
        )
        ERC721(_name, _symbol)
    {
        ticketBuyToken = IERC20(_ticketBuyToken);
        ticketPrice = _ticketBuyPrice;
        drawInterval = _drawInterval;
        poolStartTime = block.timestamp;
        ticketBuyEndTime = poolStartTime + (_ticketBuyDuration * 1 minutes);

        keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
        fee = 0.1 * 10**18;
        _setBaseURI(_tokenURI);
    }

    function buyTicket() public {
        require(
            block.timestamp <= ticketBuyEndTime,
            "You can't participate after participation deadline !!"
        );

        require(
            ticketBuyToken.transferFrom(
                msg.sender,
                address(this),
                ticketPrice * 10**ticketBuyToken.decimals()
            )
        );

        ticketNumber++;
        _mint(msg.sender, ticketNumber);

        emit NewBuy(msg.sender, ticketNumber);
    }

    function draw(uint256 userProvidedSeed) public {
        require(
            drawCount < ticketNumber - 1,
            "Can't call draw function anymore !!"
        );
        require(ticketNumber > 1, "Minimum two ticket buy is needed !!");
        require(
            block.timestamp > getNextDrawTimestamp(),
            "Draw is not started yet !!"
        );
        require(
            LINK.balanceOf(address(this)) >= fee,
            "Not enough LINK - fill contract with faucet"
        );

        requestRandomness(keyHash, fee, userProvidedSeed);
        drawCount++;

        setNextDrawTime();

        // Send some erc20 to draw excecutor
        ticketBuyToken.transfer(
            msg.sender,
            ticketPrice * 10**ticketBuyToken.decimals() / 100
        );
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 _requestId, uint256 randomness)
        internal
        override
    {
        uint256 i = ticketNumber;

        do {
            i--;
        } while (alreadyDrawResult[(randomness % i) + 1] && i > 1);

        uint256 result = (randomness % i) + 1;

        if (i == 0 || alreadyDrawResult[result]) {
            do {
                result = result + 1;
            } while (alreadyDrawResult[result] && result < ticketNumber);
        }

        if (i > ticketNumber || alreadyDrawResult[result]) {
            do {
                result = result - 1;
            } while (alreadyDrawResult[result] && result > 1);
        }

        drawResult[drawCount] = result;
        alreadyDrawResult[result] = true;
    }

    function claimPrize(uint256 _ticketNumber) public {
        require(
            drawCount == ticketNumber - 1,
            "Can't cliam prize before all draw !!"
        );
        require(
            _isApprovedOrOwner(_msgSender(), _ticketNumber),
            "ERC721: transfer caller is not owner nor approved"
        );
        require(
            !alreadyDrawResult[_ticketNumber] &&
                _ticketNumber <= ticketNumber &&
                _ticketNumber > 0,
            "You are not an winner !!"
        );

        transferFrom(msg.sender, address(this), _ticketNumber);
        _burn(_ticketNumber);
        poolWinner = msg.sender;

        require(
            ticketBuyToken.transfer(
                msg.sender,
                ticketBuyToken.balanceOf(address(this))
            )
        );
    }

    function stillValidTicket(uint256 _ticketNumber)
        public
        view
        returns (bool)
    {
        bool result = false;

        if (!alreadyDrawResult[_ticketNumber]) {
            result = true;
        }

        return result;
    }

    function getDrawResult(uint256 _drawCount) public view returns (uint256) {
        return drawResult[_drawCount];
    }

    function getFinalResult() public view returns (uint256) {
        require(
            drawCount == ticketNumber - 1,
            "Can't get result before all draw !!"
        );
        
        uint256 result;

        for (uint256 i = 1; i <= ticketNumber; i++) {
            if (!alreadyDrawResult[i]) {
                result = i;
            }
        }

        return result;
    }
    
    function getPoolWinner() public view returns (address) {
        require(
            drawCount == ticketNumber - 1,
            "Can't get winner before all draw !!"
        );
        
        return poolWinner;
    }

    function getNextDrawTimestamp() public view returns (uint256) {
        uint256 result = nextDrawTimestamp;

        if (ticketNumber > 1 && drawCount == 0) {
            result =
                ticketBuyEndTime +
                ((drawCount + 1) * drawInterval * 1 minutes);
        }

        return result;
    }

    function setNextDrawTime() internal {
        if (drawCount >= ticketNumber - 1) {
            nextDrawTimestamp = 0;
        } else if (drawCount > 0) {
            nextDrawTimestamp = block.timestamp + (drawInterval * 1 minutes);
        }
    }
    
    function claimReturn() public {
        require(
            ticketNumber == 1,
            "There are more than 1 tickets !!"
        );
        require(
            block.timestamp > ticketBuyEndTime,
            "Buy period isn't over"
            );
        require(
            _isApprovedOrOwner(_msgSender(), 1),
            "ERC721: transfer caller is not owner nor approved"
        );
        

        transferFrom(msg.sender, address(this), 1);
        _burn(1);

        require(
            ticketBuyToken.transfer(
                msg.sender,
                ticketBuyToken.balanceOf(address(this))
            )
        );
    }
}
