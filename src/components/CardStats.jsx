import React from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { convertEthHelper } from '../lib/helpers';
import config from '../configuration';

/**
 * Shows the statistics on Communities, Campaigns and tracesCount
 *
 * TODO: Check the properties that are passed, sometimes they are number, sometimes strings...
 */
const CardStats = ({ peopleCount, maxAmount, totalDonated, type, status, token }) => {
  let amountRequested = new BigNumber(convertEthHelper(maxAmount, token.decimals));
  amountRequested = amountRequested.toPrecision(8).replace(/0+$/, '');

  return (
    <div className="row card-stats">
      {['community', 'campaign'].includes(type) && (
        <div className="col-6 text-center card-center">
          <p>Giver</p>
          <span>
            <i className="fa fa-male" />
            {peopleCount}
          </span>
        </div>
      )}

      {type === 'trace' && (
        <div className="col-3 text-center card-center">
          <p>Giver</p>
          <span>
            <i className="fa fa-male" />
            {peopleCount}
          </span>
        </div>
      )}

      {['community', 'campaign'].includes(type) && (
        <div className="col-5 text-center card-center">
          <span>
            <p>Donations</p>
            <p>{totalDonated.toFixed()}</p>
          </span>
        </div>
      )}

      {type === 'trace' && (
        <div className="col-5 text-center card-center">
          {maxAmount && (
            <span>
              <p>Requested</p>
              <p>
                {amountRequested} {token.symbol}
              </p>
            </span>
          )}
        </div>
      )}

      {type === 'trace' && (
        <div className="col-4 text-center card-center">
          <p>status</p>
          <span>
            <i className="fa fa-check-circle" />
            {status}
          </span>
        </div>
      )}
    </div>
  );
};

CardStats.propTypes = {
  type: PropTypes.string.isRequired,
  peopleCount: PropTypes.number.isRequired,
  status: PropTypes.string,
  maxAmount: PropTypes.instanceOf(BigNumber),
  totalDonated: PropTypes.instanceOf(BigNumber),
  token: PropTypes.shape(),
};

CardStats.defaultProps = {
  status: 'In Progress',
  maxAmount: undefined,
  totalDonated: new BigNumber('0'),
  token: {
    symbol: config.nativeTokenName,
  },
};

export default CardStats;
