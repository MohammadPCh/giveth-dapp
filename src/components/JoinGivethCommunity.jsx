import React, { useContext } from 'react';

import CommunityButton from './CommunityButton';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { history } from '../lib/helpers';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';

/**
 * The join Giveth community top-bar
 */
const JoinGivethCommunity = () => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isEnabled, balance },
    actions: { enableProvider },
  } = useContext(Web3Context);
  const {
    state: { delegateWhitelistEnabled, projectOwnersWhitelistEnabled },
  } = useContext(WhiteListContext);

  const userIsDelegator = currentUser.isDelegator || !delegateWhitelistEnabled;
  const userIsProjectOwner = currentUser.isProjectOwner || !projectOwnersWhitelistEnabled;

  const createCommunity = () => {
    if (!userIsDelegator) {
      React.swal({
        title: 'Sorry',
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to start a Community! However, Giveth only allow a
            select group of people to start Communities
            <br />
            Please <strong>contact us on our Slack</strong>, or keep browsing
          </p>,
        ),
        icon: 'info',
        buttons: [false, 'Got it'],
      });
      return;
    }
    if (currentUser.giverId) {
      history.push('/communities/new');
    } else {
      React.swal({
        title: "You're almost there...",
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to start a Decentralized Community. To get
            started, please sign up (or sign in) first.
          </p>,
        ),
        icon: 'info',
        buttons: ['Cancel', 'Sign up now!'],
      }).then(isConfirmed => {
        if (isConfirmed) {
          history.push('/signup');
        }
      });
    }
  };

  const createCampaign = () => {
    if (!userIsProjectOwner) {
      React.swal({
        title: 'Sorry',
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to start a Campaign, however, Giveth only allow a
            select group of people to start Campaigns
            <br />
            Please <strong>contact us on our Slack</strong>, or keep browsing
          </p>,
        ),
        icon: 'info',
        buttons: [false, 'Got it'],
      });
      return;
    }
    // Use has registered
    if (currentUser.giverId) {
      history.push('/campaigns/new');
    } else {
      React.swal({
        title: "You're almost there...",
        content: React.swal.msg(
          <p>
            It&#8217;s great to see that you want to start a Campaign. To get started, please sign
            up (or sign in) first.
          </p>,
        ),
        icon: 'info',
        buttons: ['Cancel', 'Sign up now!'],
      }).then(isConfirmed => {
        if (isConfirmed) {
          history.push('/signup');
        }
      });
    }
  };

  return (
    <div id="join-giveth-community">
      <div className="vertical-align">
        <div className="text-center">
          <h3>Building the Future of Giving, with You.</h3>
          <CommunityButton className="btn btn-success" url="https://giveth.io/join">
            Join Giveth
          </CommunityButton>
          &nbsp;
          {userIsDelegator && (
            <button
              type="button"
              className="btn btn-info"
              onClick={() => {
                if (!isEnabled) {
                  enableProvider();
                } else {
                  createCommunity(currentUser, balance);
                }
              }}
            >
              Create a Community
            </button>
          )}
          {userIsProjectOwner && (
            <button
              type="button"
              className="btn btn-info"
              onClick={() => {
                if (!isEnabled) {
                  enableProvider();
                } else {
                  createCampaign(currentUser, balance);
                }
              }}
            >
              Start a Campaign
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinGivethCommunity;
