export function ImproperUsageError(message) {
  this.name = 'ImproperUsageError';
  this.message = message || 'An ImproperUsageError error has occured';
  this.stack = (new Error()).stack;
}
ImproperUsageError.prototype = Object.create(Error.prototype);
ImproperUsageError.prototype.constructor = ImproperUsageError;

export function CircularReferenceError(message) {
  this.name = 'CircularReferenceError';
  this.message = message || 'A CircularReferenceError has occured.';
  this.stack = (new Error()).stack;
}
CircularReferenceError.prototype = Object.create(Error.prototype);
CircularReferenceError.prototype.constructor = CircularReferenceError;
