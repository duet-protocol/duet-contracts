// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

interface IBondToken {
  function allowance ( address owner, address spender ) external view returns ( uint256  );
  function approve ( address spender, uint256 amount ) external returns ( bool  );
  function balanceOf ( address account ) external view returns ( uint256  );
  function burnFrom ( address account_, uint256 amount_ ) external;
  function decimals (  ) external view returns ( uint8  );
  function decreaseAllowance ( address spender, uint256 subtractedValue ) external returns ( bool  );
  function increaseAllowance ( address spender, uint256 addedValue ) external returns ( bool  );
  function mint ( address to_, uint256 amount_ ) external;
  function minter (  ) external view returns ( address  );
  function name (  ) external view returns ( string calldata  );
  function owner (  ) external view returns ( address  );
  function renounceOwnership (  ) external;
  function setMinter ( address minter_ ) external;
  function symbol (  ) external view returns ( string calldata  );
  function totalSupply (  ) external view returns ( uint256  );
  function transfer ( address to, uint256 amount ) external returns ( bool  );
  function transferFrom ( address from, address to, uint256 amount ) external returns ( bool  );
  function transferOwnership ( address newOwner ) external;
}
