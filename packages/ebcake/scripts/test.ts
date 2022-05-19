import { useLogger } from './utils';
import moment from 'moment';

const logger = useLogger(__filename);

logger.info('hello world');

const startOfWeek = moment().utc().startOf('week');

logger.info({
  convertable: true,
  convertableFrom: startOfWeek.clone().unix(),
  convertableEnd: startOfWeek.clone().endOf('week').unix(),
  redeemable: false,
  redeemableFrom: startOfWeek.clone().endOf('week').add(6, 'days').startOf('day').unix(),
  redeemableEnd: startOfWeek.clone().endOf('week').add(6, 'days').endOf('day').unix(),
  maturity: startOfWeek.clone().endOf('week').add(5, 'days').endOf('day').unix(),
});
