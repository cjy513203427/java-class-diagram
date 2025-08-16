# VSCode Java 插件激活指南

## 🎯 问题现象
- Java 文件没有语法高亮
- 类名无法点击跳转
- 无法获取类的详细信息
- Language Server 解析失败

## 🔧 解决方案

### 1. 安装必要的 Java 插件

确保安装了以下插件：

#### 核心插件包
- **Extension Pack for Java** (Microsoft)
  - 包含：Language Support for Java, Debugger for Java, Test Runner for Java, Maven for Java, Project Manager for Java, Visual Studio IntelliCode

#### 可选但推荐的插件
- **Spring Boot Extension Pack** (如果项目使用 Spring Boot)
- **Gradle for Java** (如果项目使用 Gradle)

### 2. 检查 Java 环境

#### 检查 Java 版本
```bash
java -version
javac -version
```

#### 在 VSCode 中检查 Java 路径
1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 `Java: Show Runtime Information`
3. 检查 Java 运行时配置

### 3. 配置 VSCode 设置

在 VSCode 设置中添加以下配置：

```json
{
    "java.home": "C:\\Program Files\\Java\\jdk-17", // 根据实际路径调整
    "java.configuration.detectJdksAtStart": true,
    "java.import.gradle.enabled": true,
    "java.import.maven.enabled": true,
    "java.compile.nullAnalysis.mode": "automatic",
    "java.eclipse.downloadSources": true,
    "java.maven.downloadSources": true,
    "java.sources.organizeImports.starThreshold": 99,
    "java.sources.organizeImports.staticStarThreshold": 99
}
```

### 4. 重新加载工作区

#### 方法1：重新加载窗口
1. 按 `Ctrl+Shift+P`
2. 输入 `Developer: Reload Window`
3. 回车执行

#### 方法2：清理工作区
1. 按 `Ctrl+Shift+P`
2. 输入 `Java: Clean Workspace`
3. 选择 `Restart and delete` 或 `Restart`

### 5. 检查项目结构

确保项目有正确的结构：

```
your-project/
├── src/
│   └── main/
│       └── java/
│           └── com/
│               └── yourpackage/
│                   └── YourClass.java
├── pom.xml (Maven项目)
└── build.gradle (Gradle项目)
```

### 6. 强制重新索引

#### 删除 VSCode 缓存
1. 关闭 VSCode
2. 删除项目根目录下的 `.vscode` 文件夹
3. 删除用户目录下的 VSCode 工作区缓存：
   - Windows: `%APPDATA%\Code\User\workspaceStorage\`
   - 找到对应项目的文件夹并删除

#### 重新打开项目
1. 重新启动 VSCode
2. 打开项目文件夹
3. 等待 Java Language Server 初始化完成

### 7. 检查 Language Server 状态

#### 查看输出日志
1. 按 `Ctrl+Shift+U` 打开输出面板
2. 在下拉菜单中选择 `Language Support for Java`
3. 查看是否有错误信息

#### 常见错误及解决方案

**错误1：Java runtime not found**
```
解决：设置正确的 java.home 路径
```

**错误2：Project has no explicit encoding set**
```
解决：在 pom.xml 中添加：
<properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>
```

**错误3：Classpath is incomplete**
```
解决：
1. 确保 pom.xml 或 build.gradle 配置正确
2. 运行 Maven/Gradle 依赖下载
3. 刷新项目
```

### 8. 验证插件是否正常工作

#### 测试功能
1. **语法高亮**：Java 关键字应该有颜色
2. **自动完成**：输入代码时应该有智能提示
3. **跳转定义**：`Ctrl+点击` 类名应该能跳转
4. **错误检测**：语法错误应该有红色波浪线
5. **导入优化**：`Shift+Alt+O` 应该能整理导入

#### 测试命令
按 `Ctrl+Shift+P` 尝试以下命令：
- `Java: Show Runtime Information`
- `Java: Rebuild Projects`
- `Java: Organize Imports`

### 9. 如果仍然无法工作

#### 最后的解决方案
1. **完全卸载并重新安装 Java 插件**
2. **检查防火墙/代理设置**
3. **尝试使用 VSCode Insiders 版本**
4. **检查系统环境变量 JAVA_HOME**

#### 获取帮助
- 查看 [VSCode Java 官方文档](https://code.visualstudio.com/docs/languages/java)
- 在 GitHub 上报告问题：[vscode-java](https://github.com/redhat-developer/vscode-java)

## 🎉 成功标志

当一切正常工作时，您应该看到：
- ✅ Java 文件有语法高亮
- ✅ 类名可以点击跳转
- ✅ 智能代码提示工作正常
- ✅ 错误检测和警告显示
- ✅ 状态栏显示 Java 项目信息
