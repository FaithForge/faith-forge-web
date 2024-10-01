import { Loading, Overlay } from 'react-vant';

const LoadingMask = () => {
  return (
    <>
      <Overlay visible={true} zIndex={10000}>
        <Loading
          size={64}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          type="spinner"
          color="white"
        />
      </Overlay>
    </>
  );
};

export default LoadingMask;
