import ImproperUsageError from '../errors';

export default function assert(boolean, message) {
  if (!boolean) {
    throw new ImproperUsageError(message);
  }
}
