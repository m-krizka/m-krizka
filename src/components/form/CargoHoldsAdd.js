/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/mouse-events-have-key-events */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { connect } from 'react-redux';
import { Panel, Form, ButtonToolbar, Button } from 'react-bootstrap';
import 'react-datasheet/lib/react-datasheet.css';

import { formMethods } from './_formMethods';

import Spreadsheet from './cargoHolds/Spreadsheet';
import PlanPlaceholder from './cargoHolds/PlanPlaceholder';
import constructGrid from './cargoHolds/constructGrid';

import { history } from '../../_helpers';
import ModalDraftChanged from './misc/ModalDraftChanged';
import { getCollectionFromUrl } from '../../_helpers/getCollectionFromUrl';

import parseGridToDB from '../../_helpers/parseGridToDB';
import { renderFormFields } from '../../_helpers/renderFormFields';
import { constructRecordProperties } from '../../_helpers/constructRecordProperties';
import { constructDateFocusProperties } from '../../_helpers/constructDateFocusProperties';
import { tableDataActions } from '../../_actions/tableData.actions';

// Specify cell types for each column
const cellsConfig = {
  0: 'standard',
  1: 'standard',
  2: 'standard',
  3: 'standard',
  4: 'balanceArm',
  5: 'index',
  6: 'standard',
  7: 'standard',
  8: 'standard',
};

const columns = [
  { name: 'Hold', key: 'hold' },
  { name: 'Compartment', key: 'compartment' },
  { name: 'Bay', key: 'bay' },
  { name: 'Max Weight', key: 'maxWeight' },
  { name: 'Balance Arm', key: 'balanceArm' },
  { name: 'Index/kg', key: 'indexPerKg' },
  { name: 'Fwd Arm', key: 'fwdArm' },
  { name: 'Aft Arm', key: 'aftArm' },
  { name: 'Lateral Alignment', key: 'lateralAlignment' },
];

const weightColumn = 3;
const balanceArmColumn = 4;
const indexColumn = 5;

const grid = constructGrid(columns);

class CargoHoldsAdd extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      constants: {
        referenceStation: null,
        kConstant: null,
        cConstant: null,
        lengthOfMAC: null,
        lemac: null,
      },
    };
    const { table } = props;
    const { fields } = table;
    this.state = constructDateFocusProperties(this.state, fields);
    this.state.record = constructRecordProperties(fields);

    // Add grid property to this.state.record
    const newState = Object.assign({}, this.state);
    newState.record.grid = grid;
    this.state = newState;

    this.handleCellsChanged = this.handleCellsChanged.bind(this);
    this.addRow = this.addRow.bind(this);
    this.removeRow = this.removeRow.bind(this);
    this.setIndexPerUnit = this.setIndexPerUnit.bind(this);
    this.setBalanceArmPerUnit = this.setBalanceArmPerUnit.bind(this);
    this.setIndexPerUnitForAll = this.setIndexPerUnitForAll.bind(this);
    this.setBalanceArmPerUnitForAll = this.setBalanceArmPerUnitForAll.bind(this);
    this.handleFieldChange = this.handleFieldChange.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleRadioChange = this.handleRadioChange.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.handleAircraftSelectChange = this.handleAircraftSelectChange.bind(this);
    this.handleModalDraftShow = this.handleModalDraftShow.bind(this);
    this.handleModalDraftClose = this.handleModalDraftClose.bind(this);
    this.handleDraftDiscardChanges = this.handleDraftDiscardChanges.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleCellsChanged(changes) {
    const grid = this.state.record.grid.map(row => [...row]);
    changes.forEach(({ cell, row, col, value }) => {
      grid[row][col] = { ...grid[row][col], value };
    });
    const newRecord = Object.assign({}, this.state.record);
    newRecord['grid'] = grid;
    this.setState({ record: newRecord });
  }

  addRow() {
    const { record } = this.state;
    const newRecord = Object.assign({}, record);

    const rowNumAbove = newRecord.grid[grid.length - 1]
      ? newRecord.grid[newRecord.grid.length - 1][0].value
      : 0;
    const newRowNum = rowNumAbove + 1;

    const newRow = [];
    for (let i = 0; i < columns.length; i += 1) {
      newRow.push({ value: null });
    }

    newRecord.grid.push(newRow);
    this.setState({ record: newRecord });
  }

  removeRow(index) {
    const { record } = this.state;
    const newRecord = Object.assign({}, record);
    newRecord.grid.splice(index, 1);
    this.setState({ record: newRecord });
  }

  handleModalDraftShow() {
    const { wasRecordChanged } = this.state;
    const { match } = this.props;
    const collection = getCollectionFromUrl(match.url);
    if (wasRecordChanged) {
      this.setState({
        showModalDraft: true,
      });
    } else {
      history.push(`/${collection}/draft`);
    }
  }

  handleModalDraftClose() {
    this.setState({
      showModalDraft: false,
    });
  }

  handleDraftDiscardChanges() {
    const { match } = (this.props);
    const collection = getCollectionFromUrl(match.url);
    this.handleModalDraftClose();
    history.push(`/${collection}/draft`);
  }

  handleSubmit(event) {
    event.preventDefault();
    const { dispatch, table } = this.props;
    const { record } = this.state;

    const parsedRecord = { ...record };
    parsedRecord.grid = parseGridToDB(record.grid, columns);

    dispatch(tableDataActions.create(parsedRecord, table.url));
  }

  render() {
    const { props, state } = this;
    const { table } = props;
    const { fields } = table;
    const fieldHandlers = {
      string: this.handleFieldChange,
      number: this.handleFieldChange,
      date: this.handleDateChange,
      radioDouble: this.handleRadioChange,
      select: this.handleSelectChange,
      aircraftSelect: this.handleAircraftSelectChange,
      aircraftConstantsSelect: this.handleAircraftSelectChange,
    };
    const renderedFields = renderFormFields(this, fields, fieldHandlers);

    const { record } = state;
    const { grid } = record;

    return (
      <React.Fragment>
        <ModalDraftChanged
          showing={state.showModalDraft}
          onHide={this.handleModalDraftClose}
          onDiscard={this.handleDraftDiscardChanges}
        />
        <Panel>
          <Panel.Heading>
            <Panel.Title>Add Record</Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            <Form horizontal onSubmit={this.handleSubmit}>
              {renderedFields}
              {/* CSS Grid below; 1st column spreadsheet, 2nd column seat plan */}
              <div
                className="cabin-edit-layout"
              >
                <Spreadsheet
                  cellsConfig={cellsConfig}
                  columns={columns}
                  grid={grid}
                  handleCellsChanged={this.handleCellsChanged}
                  setIndexPerUnitForAll={this.setIndexPerUnitForAll}
                  setBalanceArmPerUnitForAll={this.setBalanceArmPerUnitForAll}
                  setIndexPerUnit={this.setIndexPerUnit}
                  setBalanceArmPerUnit={this.setBalanceArmPerUnit}
                  addRow={this.addRow}
                  removeRow={this.removeRow}
                  indexColumn={indexColumn}
                  balanceArmColumn={balanceArmColumn}
                />
                <PlanPlaceholder
                  grid={grid}
                />
              </div>
              <br />
              <ButtonToolbar>
                <Button bsStyle="primary" type="submit" disabled={false}>
                  Submit As Draft
                </Button>
                <Button onClick={this.handleModalDraftShow} bsStyle="default" type="button" disabled={false}>Back</Button>
              </ButtonToolbar>
            </Form>
          </Panel.Body>
        </Panel>
      </React.Fragment>
    );
  }
}

CargoHoldsAdd.prototype.handleFieldChange = formMethods.handleFieldChange;
CargoHoldsAdd.prototype.handleSelectChange = formMethods.handleSelectChange;
CargoHoldsAdd.prototype.handleDateChange = formMethods.handleDateChange;
CargoHoldsAdd.prototype.handleRadioChange = formMethods.handleRadioChange;
CargoHoldsAdd.prototype.handleAircraftSelectChange = formMethods.handleAircraftSelectChange;
CargoHoldsAdd.prototype.setIndexPerUnit = formMethods.setIndexPerUnit;
CargoHoldsAdd.prototype.setBalanceArmPerUnit = formMethods.setBalanceArmPerUnit;
CargoHoldsAdd.prototype.setIndexPerUnitForAll = formMethods.setIndexPerUnitForAll;
CargoHoldsAdd.prototype.setBalanceArmPerUnitForAll = formMethods.setBalanceArmPerUnitForAll;

function mapStateToProps(state) {
  const { tableRecord } = state;
  return {
    tableRecord,
  };
}

const connectedCargoHoldsAdd = connect(mapStateToProps)(CargoHoldsAdd);
export { connectedCargoHoldsAdd as CargoHoldsAdd };
