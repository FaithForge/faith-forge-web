import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/es';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(LocalizedFormat);

// Default timezone set to America/Bogota for backward compatibility across legacy view calculations
dayjs.tz.setDefault('America/Bogota');
dayjs.locale('es');

/**
 * Standardized application date & time utility wrapper.
 */
export const LumbrelaDateTime = dayjs;

/**
 * Backward-compatible alias for LumbrelaDateTime.
 * @deprecated Prefer importing `LumbrelaDateTime`.
 */
export const FFDay = LumbrelaDateTime;

export default LumbrelaDateTime;
