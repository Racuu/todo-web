# To Doo 维护入口

用户照常用中文描述需求或发截图。维护者负责判断该读哪一节、改哪处、如何验证。用户说“先给方案”就先讨论，说“改一下”即可在授权范围内动手。只有查过项目仍有会影响实际结果的歧义，才用一个具体问题请用户选择。

项目是面向手机和电脑的蓝白待办网页。前端入口是 `index.html`，任务数据位于独立的 GitHub 私有仓库。公开仓库里的示例和测试均使用虚构数据，令牌不进入源码、文档或备份。

| 用户说到 | 先读 | 在 index.html 中定位 |
| --- | --- | --- |
| 新建组、清单、首页、任务去哪了 | [清单与导航](docs/product.md#清单与导航) | `defaultView`、`listHierarchy` |
| 三点、右键、字体、复制、移出组 | [菜单与外观](docs/product.md#菜单与外观) | `collectionMenu`、`taskMenu`、`menuItem` |
| 手机状态栏、详情宽度、空白处返回 | [清单与导航](docs/product.md#清单与导航) | `--list-safe-top`、`returnToLayer`、`setDrawer` |
| 任务标题截断、长按误选、步骤拖动排序、步骤删除确认、备注全选、截止日期、今天到期自动加入我的一天、计划内、重复 | [任务与日期](docs/product.md#任务与日期) | `mountEditor`、`bindStepDrag`、`datePicker`、`myDayDate`、`plannedBuckets` |
| 挪动清单、任务排序、归属、删除后找回 | [关系与排序](docs/data.md#关系与排序) | `placeList`、`compareListPosition`、`compareTasks`、`ungroup`、`removeList` |
| IndexedDB、本机缓存、打开慢、改动卡顿、两端不同步、令牌、同时编辑 | [同步与令牌](docs/data.md#同步与令牌) | `connect`、`readDevice`、`stageTask`、`refresh`、`commitChanges` |
| 导出、导入、筛选、换工具恢复 | [备份与恢复](docs/data.md#备份与恢复) | `makeBackup`、`readBackup`、`restoreMissing` |
| 验证、上线、回退、接着上次做 | [维护与交接](docs/maintenance.md) | 选相应小节；接续未完成工作时查看根目录是否有 `HANDOFF.md` |

每次维护先按表定位相关小节，交付前主动核对索引和正文。界面操作记入产品文档，字段、同步及备份规则记入数据文档，验证与发布流程记入维护文档。一项改动跨类时，各处只记本类事实。出现新的查找词、主题或代码入口变化时，同次更新本表。纯样式微调及按既有功能调整个人清单顺序，沿用现有说明。历史差异查 Git，需要交接的未完成事项见维护文档。

小改动按索引只读命中的段落、函数和直接调用处。用虚构数据验证受影响的交互，工具输出优先返回匹配行、断言和发布状态。需要排查失败或跨模块依赖时再展开。交付说明合并为结果和验证边界。
