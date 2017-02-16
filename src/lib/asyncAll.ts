import once from './once';

export type Callback = (error: Error | undefined, results?: any) => void;
export type Task = (callback: Callback) => void;

export default function asyncAll(tasks: Task[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const { length } = tasks;
    const results: any[] = [];
    let count = 0;

    const ender = once((error, res) => {
      error ? reject(error) : resolve(res);
    });

    function callback(error, result) {
      count++;

      if (error) {
        ender(error);
        return;
      }
      results[this] = result;

      if (count === length) {
        ender(undefined, results);
      }
    }

    for (let i = 0; i < length; i++) {
      try {
        tasks[i](callback.bind(i));
      } catch (error) {
        ender(error);
        return;
      }
    }
  });
}
