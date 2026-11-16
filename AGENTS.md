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
| 验证、上线、回退、接着上次做 | [维护与交接](docs/maintenance.md) | — |

每次以当前仓库版本核对本次索引指向，再独立搜索界面文案、操作入口、调用处及共用逻辑。两边有差异时先查明原因。交付前按实际差异核对索引；新增入口、路径或函数改名时，同批修正引用。

界面操作归入产品文档，字段、同步及备份归入数据文档，验证和发布归入维护文档。一项约定只维护一处正文。验证深度跟随实际影响，日常只读相关小节、返回匹配行和检查结果，失败时再展开。

改变长期项目规则前，先给用户看原文、拟改内容及影响，得到确认再改。修订路径、名称等事实性引用可随代码完成。
