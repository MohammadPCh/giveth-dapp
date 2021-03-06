import React, { Fragment, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import TraceService from 'services/TraceService';
import Trace from 'models/Trace';
import ErrorPopup from 'components/ErrorPopup';
import ConversationModal from 'components/ConversationModal';
import { authenticateUser, checkBalance } from 'lib/middleware';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';
import { sendAnalyticsTracking } from '../lib/SegmentAnalytics';

const CancelTraceButton = ({ trace, className }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const conversationModal = useRef();

  const openDialog = () => {
    if (!isForeignNetwork) {
      return displayForeignNetRequiredWarning();
    }
    return authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) return;
      checkBalance(balance)
        .then(() =>
          conversationModal.current
            .openModal({
              title: 'Cancel Trace',
              description:
                'Explain why you cancel this Trace. Compliments are appreciated! This information will be publicly visible and emailed to the Trace owner.',
              textPlaceholder: 'Explain why you cancel this Trace...',
              required: true,
              cta: 'Cancel Trace',
              enableAttachProof: false,
            })
            .then(proof =>
              TraceService.cancelTrace({
                trace,
                from: currentUser.address,
                proof,
                onTxHash: txUrl => {
                  sendAnalyticsTracking('Trace Canceled', {
                    category: 'Trace',
                    action: 'cancel',
                    donationCounters: trace.donationCounters,
                    traceId: trace.id,
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

                  React.toast.info(
                    <p>
                      Canceling this Trace is pending...
                      <br />
                      <a href={txUrl} target="_blank" rel="noopener noreferrer">
                        View transaction
                      </a>
                    </p>,
                  );
                },
                onConfirmation: txUrl => {
                  React.toast.success(
                    <p>
                      The Trace has been cancelled!
                      <br />
                      <a href={txUrl} target="_blank" rel="noopener noreferrer">
                        View transaction
                      </a>
                    </p>,
                  );
                },
                onError: (err, txUrl) => {
                  if (err === 'patch-error') {
                    ErrorPopup('Something went wrong with canceling your Trace', err);
                  } else {
                    ErrorPopup(
                      'Something went wrong with the transaction.',
                      `${txUrl} => ${JSON.stringify(err, null, 2)}`,
                    );
                  }
                },
                web3,
              }),
            ),
        )
        .catch(err => {
          if (err === 'noBalance') {
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong.', err);
          }
        });
    });
  };

  return (
    <Fragment>
      {trace.canUserCancel(currentUser) && (
        <button type="button" className={`btn btn-danger btn-sm ${className}`} onClick={openDialog}>
          <i className="fa fa-times" />
          &nbsp;Cancel
        </button>
      )}

      <ConversationModal ref={conversationModal} trace={trace} />
    </Fragment>
  );
};

CancelTraceButton.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
  className: PropTypes.string,
};

CancelTraceButton.defaultProps = {
  className: '',
};

export default React.memo(CancelTraceButton);
