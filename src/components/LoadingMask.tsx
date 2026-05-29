/**
 * Renders a full-screen loading overlay with a daisyUI spinner.
 *
 * @returns {JSX.Element} The loading overlay element.
 */
const LoadingMask = () => {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-[1px]"
      role="status"
    >
      <span className="loading loading-spinner loading-lg text-base-100" />
    </div>
  );
};

export default LoadingMask;
