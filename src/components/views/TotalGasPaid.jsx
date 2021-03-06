import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';
import gasLogo from '../../assets/gas-paid-logo.svg';

const entityTypes = { user: 'YOU', campaign: 'CAMPAIGN', trace: 'TRACE' };
const tweetHashtags = 'blockchain4good';

const TotalGasPaid = ({ gasPaidUsdValue, entity, className, tweetUrl }) => {
  let entityText = '';
  let url = 'https://trace.giveth.io';
  let gasPaidInfo = `TOTAL GAS WE PAID FOR ${entity}`;

  const isUser = entity === entityTypes.user;

  if (isUser) {
    entityText = 'me alone';
  } else {
    entityText = `this ${entity}`;
    gasPaidInfo += ':';
    url = tweetUrl;
  }

  const tweetMessage =
    'Giveth pays gas fees to collect or disburse funds donated on Giveth TRACE so' +
    ` the users don't have to! To date, Giveth has covered ${gasPaidUsdValue} USD for ${entityText}. Check it out here:`;

  const tweetTag = (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={`https://twitter.com/intent/tweet?text=${tweetMessage}&url=${url}&hashtags=${tweetHashtags}`}
      style={{ color: '#1890ff' }}
    >
      Tweet this
    </a>
  );

  return (
    <Row className={className || ''} id="TotalGasPaidView">
      <Col className="text-left my-auto" style={{ width: '34px' }}>
        <img src={gasLogo} alt="gas logo" />
      </Col>
      <Col className="col px-0 my-auto">
        <Row>
          <Col>
            <div className="pr-2">{gasPaidInfo}</div>
          </Col>
          <Col className="justify-content-between">
            <div className="font-weight-bold">
              {`${gasPaidUsdValue && gasPaidUsdValue.toFixed(0)} USD`}
            </div>
            {isUser && <div className="px-0 my-auto mr-2">{tweetTag}</div>}
          </Col>
        </Row>
      </Col>
      {!isUser && <Col className="px-0 my-auto ml-4">{tweetTag}</Col>}
    </Row>
  );
};

TotalGasPaid.propTypes = {
  gasPaidUsdValue: PropTypes.number.isRequired,
  entity: PropTypes.oneOf(Object.values(entityTypes)),
  className: PropTypes.string,
  tweetUrl: PropTypes.string,
};

TotalGasPaid.defaultProps = {
  entity: entityTypes.user,
  className: undefined,
  tweetUrl: '',
};

export default TotalGasPaid;
