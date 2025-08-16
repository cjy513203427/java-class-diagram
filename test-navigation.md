# 导航功能测试指南

## 测试步骤

### 1. 准备测试环境
1. 确保已安装Red Hat Java扩展包
2. 打开包含测试类的工作区
3. 确保Java Language Server已启动

### 2. 生成测试类图
1. 打开 `test-classes/NavigationTest.java`
2. 使用命令面板 (Ctrl+Shift+P) 执行 "Generate Class Diagram"
3. 等待类图生成完成

### 3. 测试类名导航
1. 在生成的类图中点击 "NavigationTest" 类名
2. 验证是否跳转到类定义位置
3. 检查是否有高亮显示

### 4. 测试方法导航
1. 在类图中点击 "testMethod" 方法
2. 验证是否跳转到方法定义位置
3. 测试其他方法如 "getTestField", "incrementCounter"

### 5. 测试字段导航
1. 在类图中点击 "testField" 字段
2. 验证是否跳转到字段定义位置
3. 测试其他字段如 "counter", "CONSTANT"

### 6. 测试继承关系导航
1. 打开 `test-classes/DerivedClass.java`
2. 生成类图
3. 测试点击基类和派生类的导航

## 预期结果

### 成功的导航应该包括:
- [x] 自动打开正确的Java文件
- [x] 光标定位到精确的代码位置
- [x] 目标位置有临时高亮显示
- [x] 高亮在2秒后自动消失

### 错误处理测试:
- [x] 点击不存在的元素时显示友好的错误消息
- [x] Language Server不可用时使用备选方案
- [x] 文件不存在时显示适当的错误提示

## 调试信息

### 控制台输出
检查VSCode开发者控制台中的日志输出:
- Language Server初始化信息
- 点击事件处理日志
- 导航成功/失败的详细信息

### 常见问题
1. **Language Server未启动**: 重启VSCode或重新加载窗口
2. **符号未找到**: 确保Java项目已正确编译
3. **点击无响应**: 检查webview的JavaScript控制台

## 性能测试

### 响应时间测试
- 类名导航: < 500ms
- 方法导航: < 800ms  
- 字段导航: < 800ms

### 内存使用
- Language Server客户端应该复用，不重复创建
- webview应该正确处理内存释放
