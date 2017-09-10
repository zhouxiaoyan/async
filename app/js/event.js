/**
 * Created by weiruifeng on 2017/9/10.
 */
F.module('./js/event',['./js/dom'], function(dom) {
    return {
        on(id, type, fn) {
            dom.g(id)[`on${type}`] = fn;
        }
    }
});