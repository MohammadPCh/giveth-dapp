import { withFormsy } from 'formsy-react';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { convertEthHelper } from 'lib/helpers';
import TraceItemModel from 'models/TraceItem';
import { utils } from 'web3';
import DescriptionRender from './DescriptionRender';

/** *
 * NOTE: This component is created as a Formsy form component
 * That way we can perform validation on editing traces
 * based on trace items being added
 *
 * This also means that this component needs to be wrapped in a
 * Formsy Form component or it won't mount
 *
 * See EditTrace component
 ** */

class TraceItem extends React.Component {
  componentDidMount() {
    if (this.props.isEditMode) this.props.setValue(true); // required for validation being true
  }

  render() {
    const { removeItem, item, isEditMode, token } = this.props;
    return (
      <tr>
        {isEditMode && (
          <td className="td-item-remove">
            <button type="button" className="btn btn-link" onClick={removeItem}>
              X
            </button>
          </td>
        )}
        <td className="td-item-date">{moment.utc(item.date).format('Do MMM YYYY')}</td>

        <td
          className="td-item-description"
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            minWidth: 150,
            marginBottom: 20,
          }}
        >
          {DescriptionRender(item.description)}
        </td>

        <td className="td-item-amount-fiat">
          {item.selectedFiatType} {item.fiatAmount.toFixed()}
          <br />
          <span className="help-block">
            {`1 ${token.name} = ${item.conversionRate} ${item.selectedFiatType}`}
          </span>
        </td>

        <td className="td-item-amount-ether">
          {convertEthHelper(utils.fromWei(item.wei), token.decimals)}
        </td>

        <td className="td-item-file-upload">
          {item.image && isEditMode && (
            <div className="image-preview small">
              <img src={item.image} alt="Preview of uploaded file" />
            </div>
          )}

          {item.image && !isEditMode && (
            <div className="image-preview small">
              <a href={item.image} target="_blank" rel="noopener noreferrer">
                <img src={item.image} alt="View uploaded file" style={{ height: 'initial' }} />
              </a>
            </div>
          )}
        </td>
      </tr>
    );
  }
}

TraceItem.propTypes = {
  setValue: PropTypes.func.isRequired,

  removeItem: PropTypes.func,
  item: PropTypes.instanceOf(TraceItemModel).isRequired,
  isEditMode: PropTypes.bool,
  token: PropTypes.shape().isRequired,
};

TraceItem.defaultProps = {
  isEditMode: false,
  removeItem: () => {},
};

export default withFormsy(TraceItem);
