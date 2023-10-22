import { Mask, SpinLoading } from 'antd-mobile';

const LoadingMask = () => {
  return (
    <>
      <Mask visible={true}>
        <SpinLoading
          style={{
            '--size': '64px',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          color="primary"
        />
      </Mask>
    </>
  );
};

export default LoadingMask;
