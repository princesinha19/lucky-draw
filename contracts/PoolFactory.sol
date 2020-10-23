// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
import "./DrawPool.sol";

contract PoolFactory {
    struct DrawPoolInfo {
        address poolAddress;
        string poolTokenName;
        string poolTokenSymbol;
        address ticketBuyToken;
        uint256 ticketPrice;
        uint256 drawInterval;
        uint256 poolStartTimestamp;
        uint256 ticketBuyDuration;
        string baseTokenURI;
    }

    uint256 public totalPools;
    DrawPoolInfo[] public allPools;

    event NewDrawPool(
        uint256 id,
        address drawPoolAddress,
        string poolTokenName,
        string poolTokenSymbol,
        address ticketBuyToken,
        uint256 ticketPrice,
        uint256 drawInterval,
        uint256 poolStartTimestamp,
        uint256 ticketBuyDuration,
        string baseTokenURI
    );

    function addDrawPool(
        string memory _name,
        string memory _symbol,
        address _ticketBuyToken,
        uint256 _ticketBuyPrice,
        uint256 _drawInterval,
        uint256 _ticketBuyDuration,
        string memory _baseTokenURI
    ) public {
        DrawPool newPool = new DrawPool(
            _name,
            _symbol,
            _ticketBuyToken,
            _ticketBuyPrice,
            _drawInterval,
            _ticketBuyDuration,
            _baseTokenURI
        );

        address poolAddress = address(newPool);
        
        totalPools++;

        allPools.push(
            DrawPoolInfo(
                poolAddress,
                _name,
                _symbol,
                _ticketBuyToken,
                _ticketBuyPrice,
                _drawInterval,
                block.timestamp,
                _ticketBuyDuration,
                _baseTokenURI
            )
        );

        emit NewDrawPool(
            totalPools,
            poolAddress,
            _name,
            _symbol,
            _ticketBuyToken,
            _ticketBuyPrice,
            _drawInterval,
            block.timestamp,
            _ticketBuyDuration,
            _baseTokenURI
        );
    }
}
