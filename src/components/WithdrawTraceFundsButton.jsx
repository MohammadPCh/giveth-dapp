import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';

import TraceService from 'services/TraceService';
import Trace from 'models/Trace';
import { authenticateUser, checkBalance } from 'lib/middleware';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as NotificationContext } from '../contextProviders/NotificationModalProvider';
import DonationBlockchainService from '../services/DonationBlockchainService';
import LPTrace from '../models/LPTrace';
import config from '../configuration';
import { Context as UserContext } from '../contextProviders/UserProvider';
import ErrorHandler from '../lib/ErrorHandler';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import { sendAnalyticsTracking } from '../lib/SegmentAnalytics';
import { getConversionRateBetweenTwoSymbol } from '../services/ConversionRateService';

const WithdrawTraceFundsButton = ({ trace, isAmountEnoughForWithdraw }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);
  const {
    actions: { minPayoutWarningInWithdraw },
  } = useContext(NotificationContext);

  async function sendWithdrawAnalyticsEvent(txUrl) {
    const donationsCounters = trace.donationCounters.filter(dc => dc.currentBalance.gt(0));
    // eslint-disable-next-line no-restricted-syntax
    for (const donationCounter of donationsCounters) {
      const currency = donationCounter.symbol;
      // eslint-disable-next-line no-await-in-loop
      const result = await getConversionRateBetweenTwoSymbol({
        date: new Date(),
        symbol: currency,
        to: 'USD',
      });
      const rate = result.rates.USD;
      const amount = Number(donationCounter.currentBalance);
      sendAnalyticsTracking('Trace Withdraw', {
        category: 'Trace',
        action: 'initiated withdrawal',
        amount,
        currency,
        usdValue: rate * amount,
        traceId: trace._id,
        title: trace.title,
        ownerId: trace.ownerAddress,
        traceType: trace.formType,
        traceRecipientAddress: trace.recipientAddress,
        parentCampaignId: trace.campaign.id,
        parentCampaignTitle: trace.campaign.title,
        reviewerAddress: trace.reviewerAddress,
        userAddress: currentUser.address,
        txUrl,
      });
    }
  }

  async function withdraw() {
    const userAddress = currentUser.address;
    const isRecipient = trace.recipientAddress === userAddress;
    authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) return;
      Promise.all([
        checkBalance(balance),
        DonationBlockchainService.getTraceDonationsCount(trace._id),
      ])
        .then(([, donationsCount]) => {
          if (!isAmountEnoughForWithdraw) {
            minPayoutWarningInWithdraw();
            return;
          }

          React.swal({
            title: isRecipient ? 'Withdrawal Funds to Wallet' : 'Disburse Funds to Recipient',
            content: React.swal.msg(
              <div>
                <p>
                  We will initiate the transfer of the funds to{' '}
                  {trace instanceof LPTrace && 'the Campaign.'}
                  {!(trace instanceof LPTrace) &&
                    (isRecipient ? 'your wallet.' : "the recipient's wallet.")}
                </p>
                {donationsCount > config.donationCollectCountLimit && (
                  <div className="alert alert-warning">
                    <strong>Note:</strong> Due to the current gas limitations you may be required to
                    withdrawal multiple times. You have <strong>{donationsCount}</strong> donations
                    to {isRecipient ? 'withdraw' : 'disburse'}. At each try donations from{' '}
                    <strong>{config.donationCollectCountLimit}</strong> different sources can be
                    paid.
                  </div>
                )}
                {!(trace instanceof LPTrace) && (
                  <div className="alert alert-warning">
                    Note: For security reasons and to save in fees, there is a delay of
                    approximately 2-5 days before the crypto will appear in{' '}
                    {isRecipient ? 'your' : "the recipient's"} wallet.
                  </div>
                )}
              </div>,
            ),
            icon: 'warning',
            dangerMode: true,
            buttons: ['Cancel', 'Yes, withdrawal'],
          }).then(isConfirmed => {
            if (isConfirmed) {
              TraceService.withdraw({
                trace,
                from: userAddress,
                onTxHash: txUrl => {
                  sendWithdrawAnalyticsEvent(txUrl);
                  React.toast.info(
                    <p>
                      Initiating withdrawal from Trace...
                      <br />
                      <a href={txUrl} target="_blank" rel="noopener noreferrer">
                        View transaction
                      </a>
                    </p>,
                  );
                },
                onConfirmation: txUrl => {
                  React.toast.info(
                    <p>
                      The Trace withdraw has been initiated...
                      <br />
                      <a href={txUrl} target="_blank" rel="noopener noreferrer">
                        View transaction
                      </a>
                    </p>,
                  );
                },
                onError: (err, txUrl) => {
                  let msg;
                  if (err === 'patch-error') {
                    ErrorHandler(err, 'Issue on connecting server and pushing updates');
                  } else if (err.message === 'no-donations') {
                    msg = <p>Nothing to withdraw. There are no donations to this Trace.</p>;
                  } else if (txUrl) {
                    // TODO: need to update feathers to reset the donations to previous state as this
                    // tx failed.
                    msg = (
                      <p>
                        Something went wrong with the transaction.
                        <br />
                        <a href={txUrl} target="_blank" rel="noopener noreferrer">
                          View transaction
                        </a>
                      </p>
                    );
                  } else {
                    msg = <p>Something went wrong with the transaction.</p>;
                  }

                  React.swal({
                    title: 'Oh no!',
                    content: React.swal.msg(msg),
                    icon: 'error',
                  });
                },
                web3,
              });
            }
          });
        })
        .catch(err => {
          if (err === 'noBalance') {
            ErrorHandler(err, 'There is no balance left on the account.', true);
          } else if (err !== undefined) {
            ErrorHandler(err, 'Something went wrong.', true);
          }
        });
    });
  }

  const userAddress = currentUser.address;

  return (
    <Fragment>
      {trace.canUserWithdraw(currentUser) && (
        <button
          type="button"
          className="btn btn-success btn-sm withdraw"
          onClick={() => (isForeignNetwork ? withdraw() : displayForeignNetRequiredWarning())}
        >
          <i className="fa fa-usd" />{' '}
          {trace.recipientAddress === userAddress ? 'Collect' : 'Disburse'}
        </button>
      )}
    </Fragment>
  );
};

WithdrawTraceFundsButton.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
  isAmountEnoughForWithdraw: PropTypes.bool.isRequired,
};

export default React.memo(WithdrawTraceFundsButton);
