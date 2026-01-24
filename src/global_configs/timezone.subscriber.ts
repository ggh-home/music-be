// import { EntitySubscriberInterface, EventSubscriber } from 'typeorm';
// import dayjs from 'dayjs';

// @EventSubscriber()
// export class TimezoneSubscriber implements EntitySubscriberInterface {
//   afterLoad(entity: any) {
//     // 遍历所有字段
//     for (const key of Object.keys(entity)) {
//       if (entity[key] instanceof Date) {
//         // 转换为东八区时间
//         entity[key] = dayjs(entity[key]).add(8, 'hour').toDate();
//       }
//     }
//   }
// }
