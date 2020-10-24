pragma solidity ^0.6.0;

contract TokenFaucet {
    mapping(address => mapping(address => bool)) public alreadyClaimed;

    function claimTestTokens(address token) public {
        require(
            !alreadyClaimed[msg.sender][token],
            "You have already claimed your 100 test tokens !!"
        );

        alreadyClaimed[msg.sender][token] = true;

        uint256 decimals = IERC20(token).decimals();

        IERC20(token).transfer(msg.sender, 100 * 10**decimals);
    }

    function getContractBalance(address token) public view returns (uint256) {
        uint256 decimals = IERC20(token).decimals();

        return IERC20(token).balanceOf(address(this)) / 10**decimals;
    }
}

interface IERC20 {
    function decimals() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);
}
