import React, { useState, useMemo } from 'react';
import { useChurchTerm } from '@/libs/hooks/useTerm';

interface EndOfListFunnyBadgeProps {
  /** Target context for the list: 'kids' for children lists, 'users' for user directory, 'volunteers' for servants */
  type?: 'kids' | 'users' | 'volunteers';
}

const FUNNY_KIDS_MESSAGES = [
  '¡Freno de mano! Ya revisaste hasta el último niño 🛑👶',
  '¡No le des más scroll que los peques ya están todos aquí! 🏃‍♂️💨',
  '¡Ni jugando a las escondidas encuentras más niños! 🙈🧒',
  '¡Misión cumplida! No queda ningún niño sin pasar lista 📝🎒',
  '¡Hasta aquí llegó la tropa de niños por hoy! 😇🎈',
];

const FUNNY_USERS_MESSAGES = [
  '¡Freno de mano! Ya revisaste hasta el último usuario 🛑👥',
  '¡No le des más scroll que el directorio ya llegó al final! 📱💨',
  '¡Misión cumplida! Todo el equipo y usuarios revisados 📋✨',
  '¡Ni buscando con lupa encuentras más usuarios! 🔍👤',
  '¡Llegaste al final! Todos los usuarios están presentes 👥🚀',
];

/**
 * Fun, playful end-of-list indicator that displays witty phrases tailored to kids, users, or volunteers.
 *
 * @param {EndOfListFunnyBadgeProps} props - Component props containing list type.
 * @param {'kids' | 'users' | 'volunteers'} [props.type='kids'] - Target entity context.
 * @returns {JSX.Element} The rendered funny badge.
 */
export const EndOfListFunnyBadge: React.FC<EndOfListFunnyBadgeProps> = ({ type = 'kids' }) => {
  const volunteerTerm = useChurchTerm('volunteer');
  const volunteersTerm = useChurchTerm('volunteers');

  const funnyVolunteersMessages = useMemo(() => [
    `¡Freno de mano! Ya revisaste hasta el último ${volunteerTerm.toLowerCase()} 🛑🤝`,
    `¡Misión cumplida! Todos los ${volunteersTerm.toLowerCase()} están aquí 📋✨`,
    '¡No le des más scroll que todo el equipo de servicio está presente! 🙌💫',
    `¡Ni buscando con lupa encuentras más ${volunteersTerm.toLowerCase()}! 🔍👥`,
    '¡Llegaste al final! Todo el equipo al día 🤝🚀',
  ], [volunteerTerm, volunteersTerm]);

  const messages =
    type === 'kids'
      ? FUNNY_KIDS_MESSAGES
      : type === 'volunteers'
      ? funnyVolunteersMessages
      : FUNNY_USERS_MESSAGES;
  const [index, setIndex] = useState(() => Math.floor(Math.random() * messages.length));

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % messages.length);
  };

  return (
    <div className="flex items-center justify-center py-4 text-center select-none">
      <button
        type="button"
        onClick={handleNext}
        className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer active:scale-95"
      >
        {messages[index]}
      </button>
    </div>
  );
};

export default EndOfListFunnyBadge;
