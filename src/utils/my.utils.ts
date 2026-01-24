import dayjs from 'dayjs';

export function mixUpArrays(results: Array<object>[]) {
  const mergedResults = [];
  const maxLength = Math.max(...results.map(arr => arr.length)); // 找出最长的数组长度

  for (let i = 0; i < maxLength; i++) {
    for (const arr of results) {
      if (i < arr.length) {
        mergedResults.push(arr[i]); // 按照交错顺序依次取出元素
      }
    }
  }

  return mergedResults;
}

export function formatDate(
  obj: any,
  format: string = 'YYYY-MM-DD HH:mm:ss',
): any {
  if (obj instanceof Date) {
    return dayjs(obj).format(format);
  } else if (Array.isArray(obj)) {
    return obj.map(item => formatDate(item, format));
  } else if (obj && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = formatDate(obj[key], format);
      return acc;
    }, {});
  }
  return obj;
}

export function dateTimeBeforeNow(date: Date): boolean {
  console.log(
    `dayjs(date):${dayjs(date)} dayjs():${dayjs()} 结果:${dayjs(date).isBefore(dayjs())}`,
  );
  return dayjs(date).isBefore(dayjs());
}

export function dateTimeBefore(leftDate: Date, rightDate: Date): boolean {
  return dayjs(leftDate).isBefore(dayjs(rightDate));
}
