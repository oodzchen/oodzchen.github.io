---
layout: post
title: 代码高亮测试
---

这是一段`javascript`代码

{% highlight javascript %}

function show(){
	alert(1111);
	setInterval(function(){var a = 0; var b = 1; a = [b, b = a][0]; console.log(a); console.log(b);}, 300);setInterval(function(){var a = 0; var b = 1; a = [b, b = a][0]; console.log(a); console.log(b);}, 300);setInterval(function(){var a = 0; var b = 1; a = [b, b = a][0]; console.log(a); console.log(b);}, 300);
}

function show(){
	alert(1111);
	setInterval(function(){var a = 0; var b = 1; a = [b, b = a][0]; console.log(a); console.log(b);}, 300);setInterval(function(){var a = 0; var b = 1; a = [b, b = a][0]; console.log(a); console.log(b);}, 300);setInterval(function(){var a = 0; var b = 1; a = [b, b = a][0]; console.log(a); console.log(b);}, 300);
}

{% endhighlight %}

这是一段长文本测试，看看效果。这是一段长文本测试，看看效果。这是一段长文本测试，看看效果。这是一段长文本测试，看看效果。这是一段长文本测试，看看效果。这是一段长文本测试，看看效果。这是一段长文本测试，看看效果。这是一段长文本测试，看看效果。这是一段长文本测试，看看效果。

这是一段`css`代码
{% highlight css %}

body{
	padding: 10px 20px;
	margin: 0 auto;
}
.box{
	background-color: #eee;
	color: #666;
	font-family: "微软雅黑";
}

{% endhighlight %}

这是一段`html`代码
{% highlight html %}

<div>
	<ul>
		<li>1111</li>
		<li>1111</li>
		<li>1111</li>
		<li>1111</li>
	</ul>
</div>

{% endhighlight %}

这是一段`object-c`代码

{% highlight objc %}

#import "FOXEnvironment.h"


const NSUInteger FOXDefaultNumberOfTests = 500;
const NSUInteger FOXDefaultMaximumSize = 200;

static NSUInteger FOXGetUIntegerFromEnv(const char *envname, NSUInteger defaultValue) {
    const char *envval = getenv(envname);
    unsigned long number = defaultValue;
    if (envval != NULL) {
        sscanf(envval, "%lu", &number);
    }
    return (NSUInteger)number;
}

FOX_EXPORT NSUInteger FOXGetNumberOfTests(void) {
    return FOXGetUIntegerFromEnv("FOX_NUM_TESTS", FOXDefaultNumberOfTests);
}

FOX_EXPORT NSUInteger FOXGetMaximumSize(void) {
    return FOXGetUIntegerFromEnv("FOX_MAX_SIZE", FOXDefaultMaximumSize);
}

FOX_EXPORT NSUInteger FOXGetSeed(void) {
    static NSUInteger ___seed;
    if (!___seed) {
        ___seed = FOXGetUIntegerFromEnv("FOX_SEED", (NSUInteger)time(NULL));
    }
    return ___seed;
}

{% endhighlight %}

好了，这个结束了

