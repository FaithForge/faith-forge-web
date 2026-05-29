export const PRIMARY_COLOR_APP = '#004863';
// const PRIMARY_COLOR_THEME = '#951fff';
export const BLACK_COLOR_APP = '#020D14';
export const WHITE_COLOR_APP = '#ffffff';
export const ANOTHER_COLOR = '#e7edf9';
export const ANOTHER_BLACK_COLOR = '#004863';
export const ANOTHER_ACTIVE_COLOR = '#9cc0da';
export const TEXT_PRIMARY_COLOR = '#334551';

export const buttonThemeVars = {
  primary: {
    backgroundColor: PRIMARY_COLOR_APP,
    borderColor: PRIMARY_COLOR_APP,
    textColor: WHITE_COLOR_APP,
    hoverBackgroundColor: '#00384d',
    hoverBorderColor: '#00384d',
  },
  secondary: {
    backgroundColor: ANOTHER_COLOR,
    borderColor: ANOTHER_COLOR,
    textColor: TEXT_PRIMARY_COLOR,
    hoverBackgroundColor: '#d8e3f3',
    hoverBorderColor: '#d8e3f3',
  },
  success: {
    backgroundColor: '#397b9d',
    borderColor: '#397b9d',
    textColor: WHITE_COLOR_APP,
    hoverBackgroundColor: '#326f8d',
    hoverBorderColor: '#326f8d',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: TEXT_PRIMARY_COLOR,
    hoverBackgroundColor: '#eff4f8',
    hoverBorderColor: '#eff4f8',
  },
  default: {
    backgroundColor: WHITE_COLOR_APP,
    borderColor: '#d1d5db',
    textColor: TEXT_PRIMARY_COLOR,
    hoverBackgroundColor: '#f3f4f6',
    hoverBorderColor: '#d1d5db',
  },
} as const;

export const themeVars = {
  textColor: '#334551',
  primaryColor: PRIMARY_COLOR_APP,

  buttonPrimaryBorderColor: PRIMARY_COLOR_APP,
  buttonPrimaryBackgroundColor: PRIMARY_COLOR_APP,

  // Cell
  cellTextColor: TEXT_PRIMARY_COLOR,

  // Tabbar
  tabbarHeight: '60px',
  tabbarItemFontSize: '12px',
  tabbarBackgroundColor: '#fbfcff',
  tabbarItemActiveBackgroundColor: '#fbfcff',
  tabbarItemActiveColor: ANOTHER_BLACK_COLOR,
  tabbarItemTextColor: ANOTHER_BLACK_COLOR,

  // NoticeBar
  noticeBarTextColor: 'black',
  noticeBarBackgroundColor: 'white',

  // SearchBar
  searchInputHeight: '148px',

  // Popover
  popoverActionWidth: '220px',

  //Steps
  stepActiveColor: '#397b9d',
  stepIconSize: '20px',
  stepHorizontalTitleFontSize: '14px',

  // Notify
  notifySuccessBackgroundColor: '#d6e3ff',
  notifyDangerBackgroundColor: '#ffdad6',
};
