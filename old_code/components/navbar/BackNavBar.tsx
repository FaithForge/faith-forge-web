import { useRouter } from 'next/router';
import { PiArrowLeft, PiDotsThreeVerticalBold } from 'react-icons/pi';
import { ReactNode } from 'react';

type Props = {
  title: string;
  rightActions?: PopoverAppAction[];
};

export interface PopoverAppAction {
  key: string;
  icon?: ReactNode;
  text: string;
  onClick: () => void;
}

const BackNavBar = ({ title, rightActions }: Props) => {
  const router = useRouter();

  return (
    <div className="navbar bg-base-100 shadow-xs sticky top-0 z-100">
      <div className="navbar-start">
        <div
          tabIndex={0}
          role="button"
          className="btn btn-ghost btn-circle"
          onClick={() => router.back()}
        >
          <PiArrowLeft className="h-8 w-8" />
        </div>
      </div>
      <div className="navbar-center">
        <span className="text-xl">{title}</span>
      </div>
      <div className="navbar-end">
        {rightActions && (
          <div className="dropdown dropdown-end">
            <PiDotsThreeVerticalBold className="h-8 w-8" tabIndex={0} />
            <ul
              tabIndex={0}
              className="menu menu-md dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              {rightActions.map((rightAction) => (
                <li onClick={rightAction.onClick} key={rightAction.key}>
                  <a>
                    {rightAction.icon} {rightAction.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackNavBar;
