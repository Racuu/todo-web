# To Doo 维护入口

用户照常用中文描述需求或发截图。维护者负责判断该读哪一节、改哪处、如何验证。用户说“先给方案”就先讨论，说“改一下”即可在授权范围内动手。只有查过项目仍有会影响实际结果的歧义，才用一个具体问题请用户选择。

项目是面向手机和电脑的蓝白待办网页。前端入口是 `index.html`，任务数据位于独立的 GitHub 私有仓库。公开仓库里的示例和测试均使用虚构数据，令牌不进入源码、文档或备份。

| 用户说到 | 先读 | 在 index.html 中定位 |
| --- | --- | --- |
| 新建组、清单、首页、任务去哪了 | [清单与导航](docs/product.md#清单与导航) | `defaultView`、`listHierarchy` |
| 三点、右键、字体、复制、移出组 | [菜单与外观](docs/product.md#菜单与外观) | `collectionMenu`、`taskMenu`、`menuItem` |
| 任务详情、截止日期、计划内、重复 | [任务与日期](docs/product.md#任务与日期) | `mountEditor`、`datePicker`、`plannedBuckets` |
| 排序、归属、删除后找回 | [关系与排序](docs/data.md#关系与排序) | `compareTasks`、`ungroup`、`removeList` |
| 两端不同步、令牌、同时编辑 | [同步与令牌](docs/data.md#同步与令牌) | `connect`、`refresh`、`commitChanges` |
| 导出、导入、筛选、换工具恢复 | [备份与恢复](docs/data.md#备份与恢复) | `makeBackup`、`readBackup`、`restoreMissing` |
| 验证、上线、回退、接着上次做 | [维护与交接](docs/maintenance.md) | 选相应小节；接续未完成工作时查看根目录是否有 `HANDOFF.md` |

按需阅读并搜索函数名。涉及多个模块时补读相关行，例如修改清单归属时，一并核对跨端同步和备份恢复。规则随行为变化一同更新，历史细节用 Git 提交查找。
