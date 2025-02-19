import { Account, AccountLike } from "@ledgerhq/types-live";
import { v5 as uuidv5 } from "uuid";
import { WalletState, accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import byFamily from "../generated/walletApiAdapter";
import type { Transaction } from "../generated/types";
import { isTokenAccount } from "../account";
import {
  WalletAPIAccount,
  WalletAPICurrency,
  WalletAPITransaction,
  WalletAPISupportedCurrency,
  GetWalletAPITransactionSignFlowInfos,
} from "./types";
import { FAMILIES_MAPPING_LL_TO_WAPI, FAMILIES_MAPPING_WAPI_TO_LL } from "./constants";

// The namespace is a randomly generated uuid v4 from https://www.uuidgenerator.net/
const NAMESPACE = "c3c78073-6844-409e-9e75-171ab4c7f9a2";
const uuidToAccountId = new Map<string, string>();

export const getAccountIdFromWalletAccountId = (walletAccountId: string): string | undefined =>
  uuidToAccountId.get(walletAccountId);

export const getWalletApiIdFromAccountId = (id: string): string => uuidv5(id, NAMESPACE);

export function accountToWalletAPIAccount(
  walletState: WalletState,
  account: AccountLike,
  parentAccount?: Account | null,
): WalletAPIAccount {
  const walletApiId = uuidv5(account.id, NAMESPACE);
  uuidToAccountId.set(walletApiId, account.id);

  if (isTokenAccount(account)) {
    if (!parentAccount) {
      throw new Error("No 'parentAccount' account provided for token account");
    }

    const parentWalletApiId = getWalletApiIdFromAccountId(parentAccount.id);

    uuidToAccountId.set(parentWalletApiId, parentAccount.id);

    const parentAccountName = accountNameWithDefaultSelector(walletState, parentAccount);

    return {
      id: walletApiId,
      parentAccountId: parentWalletApiId,
      balance: account.balance,
      address: parentAccount.freshAddress,
      blockHeight: parentAccount.blockHeight,
      lastSyncDate: parentAccount.lastSyncDate,
      name: `${parentAccountName} (${account.token.ticker})`,
      currency: account.token.id,
      spendableBalance: account.spendableBalance,
    };
  }
  const name = accountNameWithDefaultSelector(walletState, account);

  return {
    id: walletApiId,
    name,
    address: account.freshAddress,
    currency: account.currency.id,
    balance: account.balance,
    spendableBalance: account.spendableBalance,
    blockHeight: account.blockHeight,
    lastSyncDate: account.lastSyncDate,
  };
}

export function currencyToWalletAPICurrency(
  currency: WalletAPISupportedCurrency,
): WalletAPICurrency {
  if (currency.type === "TokenCurrency") {
    return {
      type: "TokenCurrency",
      standard: "ERC20",
      id: currency.id,
      ticker: currency.ticker,
      contract: currency.contractAddress,
      name: currency.name,
      parent: currency.parentCurrency.id,
      color: currency.parentCurrency.color,
      decimals: currency.units[0].magnitude,
    };
  }

  return {
    type: "CryptoCurrency",
    id: currency.id,
    ticker: currency.ticker,
    name: currency.name,
    family: FAMILIES_MAPPING_LL_TO_WAPI[currency.family] ?? currency.family,
    color: currency.color,
    decimals: currency.units[0].magnitude,
  };
}

export const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPITransaction,
  Transaction
> = ({ walletApiTransaction, account }) => {
  const liveFamily =
    FAMILIES_MAPPING_WAPI_TO_LL[walletApiTransaction.family] ?? walletApiTransaction.family;

  const familyModule = byFamily[liveFamily];

  if (familyModule) {
    return familyModule.getWalletAPITransactionSignFlowInfos({ walletApiTransaction, account });
  }

  /**
   * If we don't have an explicit implementation for this family, we fallback
   * to just returning the transaction as is
   * This is not ideal and could lead to unforseen issues since we can't make
   * sure that what is received from the WalletAPI is compatible with the
   * Ledger Live implementation of the family
   * Not having an explicit WalletAPI adapter for a family should be considered
   * an error and thorw an exception
   */
  return {
    canEditFees: false,
    liveTx: { ...walletApiTransaction } as Partial<Transaction>,
    hasFeesProvided: false,
  };
};
