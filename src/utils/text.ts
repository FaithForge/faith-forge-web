export const capitalizeWords = (input: string): string => {
  if (input.length === 0) {
    return input;
  }

  const words = input.split(' ');
  const capitalizedWords = words.map((word) => {
    const firstChar = word.charAt(0).toUpperCase();
    const restOfString = word.slice(1).toLowerCase();
    return firstChar + restOfString;
  });

  return capitalizedWords.join(' ');
};
