/* tslint:disable:jsx-no-multiline-js */
import React from 'react';
import classnames from 'classnames';
import List from '../list';
import Flex from '../flex';
import SubMenu from './SubMenu';
import Button from '../button';
import { MenuProps, ValueType, DataItem } from './PropsType';

export interface StateType {
  value?: ValueType;
  firstLevelSelectValue: string;
}

export default class Menu extends React.Component<MenuProps, StateType> {
  static defaultProps = {
    prefixCls: 'am-menu',
    subMenuPrefixCls: 'am-sub-menu',
    radioPrefixCls: 'am-radio',
    multiSelectMenuBtnsCls: 'am-multi-select-btns',
    MenuSelectContanerPrefixCls: 'am-menu-select-container',
    data: [],
    level: 2,
    onChange: () => { },
    onOk: () => { },
    onCancel: () => { },
    multiSelect: false,
  };

  constructor(props: MenuProps) {
    super(props);
    this.state = {
      firstLevelSelectValue: this.getNewFsv(props),
      value: props.value,
    };
  }
  componentWillReceiveProps(nextProps: MenuProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({
        firstLevelSelectValue: this.getNewFsv(nextProps),
        value: nextProps.value,
      });
    }
  }

  onMenuOk = () => {
    const { onOk } = this.props;
    if (onOk) {
      onOk(this.state.value);
    }
  }

  onMenuCancel = () => {
    const { onCancel } = this.props;
    if (onCancel) {
      onCancel();
    }
  }

  getNewFsv(props: MenuProps) {
    const { value, data } = props;
    let firstValue = '';
    if (value && value.length) {  // if has init path, chose init first value
      firstValue = value[0] as string; // this is a contract
    } else if (data && !data[0].isLeaf) {  // chose the first menu item if it's not leaf.
      firstValue = data[0].value;
    }

    return firstValue;
  }

  onClickFirstLevelItem = (dataItem: DataItem) => {
    const { onChange } = this.props;
    this.setState({
      firstLevelSelectValue: dataItem.value,
    });
    if (dataItem.isLeaf && onChange) {
      onChange([dataItem.value]);
    }
  }

  getSelectValue = (dataItem: DataItem) => {
    const { level, multiSelect } = this.props;
    if (multiSelect) {
      const { value, firstLevelSelectValue } = this.state;
      if (value && value.length > 0) {
        if (level === 2 && value[0] !== firstLevelSelectValue) {
          /* if level is 2, when first level is reselect, reset submenu array */
          return [firstLevelSelectValue, [dataItem.value]];
        } else {
          /* if level is 1, or first level isn't changed when level is 2, just do add or delete for submenu array  */
          const chosenValues = (level === 2) ? value[1] as string[] : value; // FIXME: hack type
          const existIndex = chosenValues.indexOf(dataItem.value);
          if (existIndex === -1) {
            chosenValues.push(dataItem.value);
          } else {
            chosenValues.splice(existIndex, 1);
          }
          return value;
        }
      } else {
        /* if value is not exist before, init value */
        return (level === 2) ? [firstLevelSelectValue, [dataItem.value]] : [dataItem.value];
      }
    }

    return (level === 2) ? [this.state.firstLevelSelectValue, dataItem.value] : [dataItem.value];
  }

  onClickSubMenuItem = (dataItem: DataItem) => {
    const { onChange } = this.props;
    const value = this.getSelectValue(dataItem);
    this.setState({ value });
    setTimeout(() => {
      // if onChange will close the menu, set a little time to show its selection state.
      if (onChange) {
        onChange(value);
      }
    }, 300);
  }

  render() {
    const {
      className, style, height, data = [],
      prefixCls, level, multiSelect,
      multiSelectMenuBtnsCls, MenuSelectContanerPrefixCls,
    } = this.props;
    const { firstLevelSelectValue, value } = this.state;
    let subMenuData = data; // menu only has one level as init

    if (level === 2) {
      let parent = data;
      if (firstLevelSelectValue && firstLevelSelectValue !== '') {
        parent = data.filter(dataItem => dataItem.value === firstLevelSelectValue);
      }

      if (parent[0] && parent[0].children && parent[0].isLeaf !== true) {
        subMenuData = parent[0].children;
      } else {
        subMenuData = [];
      }
    }

    let subValue = value && (value.length > 0) && [...value] || [];
    if (level === 2 && subValue.length > 1) {
      subValue.shift();
      if (multiSelect) {
        /* example: [[1,2,3]] -> [1,2,3] */
        subValue = subValue[0] as string[]; // FIXME: hack type
      }
    }

    const parentValue = (value && (value.length > 1) && level === 2) ? value[0] : null;
    const subSelInitItem = subMenuData.filter(dataItem => subValue.indexOf(dataItem.value) !== -1).map((item) => {
      return item.value;
    });

    let showSelect = true;
    if (level === 2 && parentValue !== firstLevelSelectValue) {
      showSelect = false;
    }

    const heightStyle = {
      height: `${Math.round(height || document.documentElement.clientHeight / 2)}px`,
    };

    return (
      <Flex
        className={classnames({
          [prefixCls as string]: true,
          [className as string]: !!className,
        })}
        style={{
          ...style,
          ...heightStyle,
        }}
        direction="column"
        align="stretch"
      >
        <Flex
          align="start"
          className={classnames({
            [MenuSelectContanerPrefixCls as string]: true,
          })}
        >
          {level === 2 &&
            <Flex.Item style={heightStyle}>
              <List role="tablist">
                {data.map((dataItem, index) => (
                  <List.Item
                    className={dataItem.value === firstLevelSelectValue ? `${prefixCls}-selected` : ''}
                    onClick={() => this.onClickFirstLevelItem(dataItem)}
                    key={`listitem-1-${index}`}
                    role="tab"
                    aria-selected={dataItem.value === firstLevelSelectValue}
                  >
                    {dataItem.label}
                  </List.Item>
                ))}
              </List>
            </Flex.Item>
          }
          <Flex.Item
            style={heightStyle}
            role="tabpanel"
            aria-hidden="false"
            className={classnames({
              [`${MenuSelectContanerPrefixCls}-submenu`]: true,
            })}
          >
            <SubMenu
              subMenuPrefixCls={this.props.subMenuPrefixCls}
              radioPrefixCls={this.props.radioPrefixCls}
              subMenuData={subMenuData}
              selItem={subSelInitItem}
              onSel={this.onClickSubMenuItem}
              showSelect={showSelect}
              multiSelect={multiSelect}
            />
          </Flex.Item>
        </Flex>
        {multiSelect &&
          (<div
            className={classnames({
              [multiSelectMenuBtnsCls as string]: true,
            })}
          >
            <Button
              inline
              className={classnames({
                [`${multiSelectMenuBtnsCls}-btn`]: true,
              })}
              onClick={this.onMenuCancel}
            >
              取消
            </Button>
            <Button
              inline
              type="primary"
              className={classnames({
                [`${multiSelectMenuBtnsCls}-btn`]: true,
              })}
              onClick={this.onMenuOk}
            >
              确定
            </Button>
          </div>)}
      </Flex>
    );
  }
}
