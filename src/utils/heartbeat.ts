export interface HeartBeatConfig {
  tag: string;
  action: Function;
  interval: number;
}

const heartbeatTasks: {[key: string]: number} = {};
export const start = (config: HeartBeatConfig) => {
  if(heartbeatTasks[config.tag]) {
    clearInterval(heartbeatTasks[config.tag]);
  }
  heartbeatTasks[config.tag] = setInterval(config.action, config.interval);
};

export const stop = (tag: string) => {
  if (heartbeatTasks[tag]) {
    clearInterval(heartbeatTasks[tag]);
  }
};

export const clearAllTasks = () => {
  for(const tag in heartbeatTasks) {
    clearInterval(heartbeatTasks[tag]);
  }
};