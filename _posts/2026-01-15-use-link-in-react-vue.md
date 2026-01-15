---
layout: post
title: 如何正确的在 React 或 Vue 中使用链接
---

很多人在写 React 项目中的连接的时候习惯使用 `onClick` 而不是 `a` 标签或者 react-router 这类库中的 `<Link>` 组件 ，让我们看看两种方式有什么不同。

我们先用 `a` 标签来实现一个普通的连接用于跳转到 example.com：

<a style="margin: 1rem; display: inline-block; padding: 1rem; border: 1px solid blue; border-radius: 4px; cursor: pointer;" href="https://example.com" target="_blank">点击打开 example.com</a>

对于这个链接，浏览器实现了以下交互：

1. 按鼠标左键，打开链接
2. 把鼠标悬停在点击区域，你能在浏览器左下角看到完整的链接网址预览
3. 点击鼠标右键，可以在菜单中看到“复制链接”选项，你可以复制这个链接并分享到别的地方
4. 点击鼠标中键，多数浏览器的默认行为是在背景选项卡中打开页面，不会自动跳转，而是停留在当前页面
5. 按住 `Ctrl` 的同时点击链接，其表现等同于鼠标中键
6. 在页面上按 `Tab` 键可以定位到该链接，然后按 `Enter` 打开
7. 屏幕阅读器可以定位到该链接，并告诉你这是一个网址链接

作为对比，使用 `onClick` 来实现一个可点击区域 ，效果如下：

<span id="link-onclick" style="margin: 1rem; display: inline-block; padding: 1rem; border: 1px solid blue; border-radius: 4px; cursor: pointer;">点击打开 example.com</span>
<script>
	document.querySelector('#link-onclick').onclick = function(e) {
		e.preventDefault()
		window.open('https://example.com', '_blank')
	}
</script>


你会发现 `onClick` 模式你只能做到 “标左键，打开链接” 这一项，其他的几个交互都无法实现。更不用说其他原生样式表现，比如鼠标在链接上悬浮的时候显示下划线，表明这是一个可点击的链接，以及点击之后链接会改变颜色，告知用户该链接已经访问过了。这些行为对于残障人士十分重要。一些设计人员对于 Web 标准了解不够，往往会忽略这些交互细节，而对于开发人员来说，这些都是很重要的基础知识。
