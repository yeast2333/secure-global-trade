# 第三章用例图 · 插入 Word 说明

本目录为用例图源文件。**论文中禁止使用代码排版替代正式插图**：请在 Word 中插入 **矢量图（SVG）** 或 **≥300 DPI 的 PNG**。

## 图 3-1 核心用例（推荐）

| 文件 | 用途 |
|------|------|
| `chapter3-usecases-core.puml` | PlantUML 标准 UML 用例图 |
| `chapter3-usecases-core.mmd` | Mermaid 单张大图（可选） |
| `chapter3-usecases-partA-catalog-cart.mmd` | **分图 a** · UC-01〜05 |
| `chapter3-usecases-partB-account.mmd` | **分图 b** · UC-06〜07 |
| `chapter3-usecases-partC-orders.mmd` | **分图 c** · UC-08〜09 |
| `chapter3-usecases-partD-security.mmd` | **分图 d** · UC-10〜11 |

### 导出步骤（任选其一）

1. **在线 PlantUML（免安装）**  
   - 打开 <https://www.plantuml.com/plantuml/uml>  
   - 将 `chapter3-usecases-core.puml` 全文粘贴到左侧编辑区  
   - 右侧预览确认后，`Export diagram` → `PNG` 或 `SVG`  
   - Word：**插入 → 图片 → 此设备**，选导出的 PNG/SVG  

1b. **在线 Mermaid**  
   - 打开 <https://mermaid.live>  
   - 粘贴 `chapter3-usecases-core.mmd` 正文 → **PNG / SVG** 导出后插入 Word  

2. **本地插件**  
   - VS Code/Cursor 安装 PlantUML + Java/Graphviz 依官方文档配置  
   - 打开 `.puml` 右键导出 PNG/SVG  

3. **Word 对齐**  
   - 图序与图题按学院模板：**图下方**居中「图 3-1 …」  
   - 若图超宽：**图片工具 → 锁定纵横比**，宽度一般不超过版心（约 **14 cm** ）  

---

## 附：安全分块示意图（可选 图 3-1 附图）

| 文件 | 用途 |
|------|------|
| `chapter3-usecases-security-context.mmd` | Mermaid「系统边界内的能力分组」简略示意，不占编号或作补充 |

导出：<https://mermaid.live> 粘贴 `.mmd` 正文 → **PNG/SVG**。

---

正文用例条目与 **表 3-2 UC-01〜UC-11** 一致，可作图旁「图注」简述。
