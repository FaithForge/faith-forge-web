import { Mask, SpinLoading } from 'antd-mobile';

const LoadingMask = () => {
  return (
    <>
      <Mask visible={true}>
        <SpinLoading style={{ '--size': '48px' }} color="primary" />
      </Mask>
    </>
  );
};

export default LoadingMask;
