const 怪盗团男角色 = z.object({
  在场状态: z.string().prefault('不在场'),
  关系: z.string().prefault('陌生'),
  态度: z.string().prefault('陌生'),
  COOP等级: z.coerce.number().prefault(0),
  外貌特征: z.record(z.string(), z.string()).prefault({}),
  当前服装: z.object({
    上装: z.string().prefault(''),
    下装: z.string().prefault(''),
    鞋子: z.string().prefault(''),
  }).prefault({}),
  效果状态: z.record(z.string(), z.object({
    类型: z.string(),
    效果: z.string(),
    剩余时间: z.string(),
    来源: z.string(),
  })).prefault({}),
  互动记录: z.object({
    难忘事件: z.array(z.string()).prefault([]),
    最近互动: z.string().prefault(''),
  }).prefault({}),
  性经验: z.object({
    性交次数: z.coerce.number().prefault(0),
    性伴侣数: z.coerce.number().prefault(0),
    性癖好: z.array(z.string()).prefault([]),
  }).prefault({}),
  生理状态: z.object({
    阴茎状态: z.string().prefault('未勃起'),
  }).prefault({}),
}).prefault({})

const 怪盗团女角色 = z.object({
  在场状态: z.string().prefault('不在场'),
  关系: z.string().prefault('陌生'),
  态度: z.string().prefault('陌生'),
  COOP等级: z.coerce.number().prefault(0),
  外貌特征: z.record(z.string(), z.string()).prefault({}),
  当前服装: z.object({
    上装: z.string().prefault(''),
    下装: z.string().prefault(''),
    鞋子: z.string().prefault(''),
    内衣: z.string().prefault(''),
    袜子: z.string().prefault(''),
  }).prefault({}),
  效果状态: z.record(z.string(), z.object({
    类型: z.string(),
    效果: z.string(),
    剩余时间: z.string(),
    来源: z.string(),
  })).prefault({}),
  互动记录: z.object({
    难忘事件: z.array(z.string()).prefault([]),
    最近互动: z.string().prefault(''),
  }).prefault({}),
  性经验: z.object({
    处女: z.boolean().prefault(true),
    性交次数: z.coerce.number().prefault(0),
    性伴侣数: z.coerce.number().prefault(0),
    初次对象: z.string().prefault(''),
    口交经验: z.string().prefault(''),
    性交经验: z.string().prefault(''),
    性癖好: z.array(z.string()).prefault([]),
  }).prefault({}),
  生理状态: z.object({
    阴道润滑: z.string().prefault(''),
    乳头状态: z.string().prefault(''),
    阴蒂状态: z.string().prefault(''),
    子宫状态: z.string().prefault(''),
  }).prefault({}),
}).prefault({})

const 摩尔加纳Schema = z.object({
  在场状态: z.string().prefault('不在场'),
  关系: z.string().prefault('陌生'),
  态度: z.string().prefault('陌生'),
  COOP等级: z.coerce.number().prefault(0),
  互动记录: z.object({
    难忘事件: z.array(z.string()).prefault([]),
    最近互动: z.string().prefault(''),
  }).prefault({}),
}).prefault({})

const COOP角色 = z.object({
  在场状态: z.string().prefault('不在场'),
  关系: z.string().prefault('陌生'),
  COOP等级: z.coerce.number().prefault(0),
  互动记录: z.object({
    难忘事件: z.array(z.string()).prefault([]),
    最近互动: z.string().prefault(''),
  }).prefault({}),
}).prefault({})

export const Schema = z.object({
  主角信息: z.object({
    身份: z.string().prefault('Joker'),
    姓名: z.string().prefault('雨宫莲'),
    性别: z.string().prefault('男'),
    年龄: z.coerce.number().prefault(16),
    外貌: z.string().prefault(''),
    性格: z.string().prefault(''),
    五维: z.object({
      知识: z.coerce.number().prefault(1),
      勇气: z.coerce.number().prefault(1),
      灵巧: z.coerce.number().prefault(1),
      温柔: z.coerce.number().prefault(1),
      魅力: z.coerce.number().prefault(1),
    }).prefault({}),
  }).prefault({}),
  时间系统: z.object({
    日期: z.string().prefault('2015年04月09日-星期四'),
    时段: z.string().prefault('放学后'),
    天气: z.string().prefault('阴'),
    当前地点: z.string().prefault('东京·四轩茶屋'),
  }).prefault({}),
  剧情进度: z.object({
    当前阶段: z.string().prefault('序章'),
    当前宫殿: z.string().prefault(''),
    截止日: z.string().prefault(''),
    攻略状态: z.string().prefault('未开始'),
    剩余天数: z.coerce.number().prefault(0),
    宫殿主结局: z.string().prefault('未攻略'),
    已触发主线事件: z.array(z.string()).prefault([]),
  }).prefault({}),
  资源: z.object({
    金钱: z.coerce.number().prefault(0),
    道具: z.record(z.string(), z.coerce.number()).prefault({}),
  }).prefault({}),
  日历: z.object({
    临时: z.record(z.string(), z.object({
      标题: z.string(),
      内容: z.string(),
      时间: z.string().prefault(''),
      结束时间: z.string().prefault(''),
      重复规则: z.string().prefault('无'),
    })).prefault({}),
    重复: z.record(z.string(), z.object({
      标题: z.string(),
      内容: z.string(),
      时间: z.string().prefault(''),
      结束时间: z.string().prefault(''),
      重复规则: z.string().prefault('无'),
    })).prefault({}),
  }).prefault({}),
  事件信号: z.array(z.string()).prefault([]),
  怪盗团: z.object({
    坂本龙司: 怪盗团男角色,
    摩尔加纳: 摩尔加纳Schema,
    高卷杏: 怪盗团女角色,
    喜多川祐介: 怪盗团男角色,
    新岛真: 怪盗团女角色,
    佐仓双叶: 怪盗团女角色,
    奥村春: 怪盗团女角色,
  }).prefault({}),
  COOP角色: z.object({
    明智吾郎: COOP角色,
    武见妙: COOP角色,
    川上贞代: COOP角色,
    御船千早: COOP角色,
    佐仓惣治郎: COOP角色,
    岩井宗久: COOP角色,
    大宅一子: COOP角色,
    三岛由辉: COOP角色,
    吉田寅之助: COOP角色,
    东乡一二三: COOP角色,
    织田信也: COOP角色,
    新岛冴: COOP角色,
    芳泽霞: COOP角色,
    丸喜拓人: COOP角色,
  }).prefault({}),
}).prefault({})

export type Schema = z.output<typeof Schema>
