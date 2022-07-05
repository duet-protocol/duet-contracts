// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

interface IIMigratorChef {
  function migrate ( address token ) external returns ( address  );
}
