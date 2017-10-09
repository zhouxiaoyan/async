/**
 * Created by weiruifeng on 2017/9/10.
 */
(function(F) {
    // 模块缓存器。存储已创建模块
    let moduleCache = {};

    function getUrl(moduleName) {
        // 拼接完整的文件路径字符串，如'lib/ajax' => 'lib/ajax.js'
        return String(moduleName).replace(/\.js$/g, '') + '.js';
    }

    function loadScript(src, id) {
        let _script = document.createElement('script');
        // 文件类型
        _script.type = 'text/JavaScript';
        // 确认编码
        _script.charset = 'UTF-8';
        // 异步加载
        _script.async = true;
        // 文件路径
        _script.src = src;
        // 文件id
        _script.id = id;
        document.getElementsByTagName('head')[0].appendChild(_script);
    }

    function deleteScript(id) {
        const deleteJs = document.getElementById(id);
        console.log(deleteJs);
        if(deleteJs) {
            document.getElementsByTagName('head')[0].removeChild(deleteJs);
        }
    }

    /**
     * 异步加载依赖模块所在文件
     * @param moduleName        模块路径（id）
     * @param callback          模块加载完成回调函数
     */
    function loadModule(moduleName, callback) {
        let _module;
        // 如果依赖模块被要求加载过
        if(moduleCache[moduleName]) {
            _module = moduleCache[moduleName];
            // 如果模块加载完成
            if(_module.status === 'loaded') {
                // 执行模块加载完成后回调函数
                setTimeout(callback(_module.exports), 0);
            } else {
                // 缓存该模块所处文件加载完成回调函数
                _module.onload.push(callback);
            }
            // 模块第一次被依赖引用
        } else {
            // 缓存该模块初始化信息
            moduleCache[moduleName] = {
                // 模块ID
                moduleName: moduleName,
                // 模块对应文件加载状态(默认加载中)
                status: 'loading',
                // 模块接口
                exports: null,
                // 模块对应文件加载完成回调函数缓冲器
                onload: [callback]
            };
            // 加载模块对应文件
            loadScript(getUrl(moduleName), moduleName);
        }
    }

    /**
     * 设置模块并执行模块构造函数
     * @param moduleName        模块ID名称
     * @param params            依赖模块
     * @param callback          模块构造函数
     */
    function setModule(moduleName, params, callback) {
        let fn;
        // 如果模块被调用过
        if(moduleCache[moduleName]) {
            let _module = moduleCache[moduleName];
            // 设置模块已经加载完成
            _module.status = 'loaded';
            // 矫正模块接口
            _module.exports = callback ? callback.apply(_module, params) : null;
            // 执行模块文件加载完成回调函数
            while(fn = _module.onload.shift()) {
                fn(_module.exports);
            }
        } else {
            // 模块不存在（匿名模块），则直接执行构造函数
            callback && callback.apply(null, params);
        }
        // 删除加载的script标签
        deleteScript(moduleName);
    }

    /**
     * 创建或调用模块方法
     * @param url           模块url
     * @param modDeps       依赖模块
     * @param modCallback   模块主函数
     */
    F.module = function(url, modDeps, modCallback) {
        // 将参数转化为数组
        let args = [].slice.call(arguments);
        // 获取模块构造函数（参数数组中最后一个参数成员）
        let callback = args.pop();
        // 获取依赖模块（紧邻回调函数参数，且数据类型为数组）
        let deps = (args.length && args[args.length - 1] instanceof Array) ? args.pop() : [];
        // 该模块url（模块ID）
        url = args.length ? args.pop() : null;
        //  依赖模块序列
        let params = [];
        // 未加载的依赖模块数量统计
        let depsCount = 0;
        // 依赖模块序列中索引值
        let i = 0;
        // 依赖模块序列长度
        let len;

        if(len = deps.length) {
            while(i < len) {
                (function(i) {
                    // 增加未加载依赖模块数量统计
                    depsCount++;
                    // 异步加载依赖模块
                    //假如一个模块a依赖多个其他模块如b、c，那么会调用loadModule初始化b、c，并把function(mod) {
                        depsCount--;
                        params[i] = mod;
                        if(depsCount === 0) {
                        setModule(url, params, callback);
                        //}这个回调函数存入b\c模块的onload数组中，存入后，创建<script>标签，引入b、c模块，这里是异步的，如果b、c模块一旦
                           // 加载完毕，会再次调用这个F.module函数，若b、c模块没有依赖于其他模块，那么他们
                            //会执行setmoudule函数，设置自己(本模块)的状态为loaded，并执行保存在onload中的函数，会调用刚刚的那个回调。等到
                            //depscount为0，就会调用setmodule来设置a模块。大体如此，还有许多细节问题
                 
                   //参数mod是所来来模块的export。
                    loadModule(deps[i], function(mod) {
                        // 依赖模块序列中添加依赖模块数量统一减一
                        depsCount--;
                        params[i] = mod;
                        // 如果依赖模块全部加载
                        if(depsCount === 0) {
                            // 在模块缓存器中矫正该模块，并执行构造函数
                            setModule(url, params, callback);
                        }
                    });
                })(i);
                // 遍历下一个模块
                i++;
            }
            // 无依赖模块，直接执行回调函数
        } else {
            // 在模块缓存器中矫正该模块，并执行构造函数
            setModule(url, [], callback);
        }
    }
})((function() {
    // 创建模块管理器对象F，并保存在全局作用域中
    return window.F = {};
})());
