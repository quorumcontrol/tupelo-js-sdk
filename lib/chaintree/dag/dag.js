"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
class Dag {
    constructor(tip, store) {
        this.tip = tip;
        this.store = store;
    }
    get(cid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.store.get(cid);
        });
    }
    resolve(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.resolveAt(this.tip, path);
        });
    }
    resolveAt(tip, path) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const str_path = path.join("/");
            const resolved = this.store.resolve(tip, str_path);
            let lastVal;
            try {
                try {
                    for (var resolved_1 = __asyncValues(resolved), resolved_1_1; resolved_1_1 = yield resolved_1.next(), !resolved_1_1.done;) {
                        let v = resolved_1_1.value;
                        lastVal = v;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (resolved_1_1 && !resolved_1_1.done && (_a = resolved_1.return)) yield _a.call(resolved_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            catch (err) {
                const e = err;
                if (!e.message.startsWith("Object has no property")) {
                    throw err;
                }
            }
            // nothing was resolvable, return full path as the remainder
            if (typeof lastVal === 'undefined') {
                return { remainderPath: path, value: null };
            }
            // if remainderPath is not empty, then the value was not found and an
            // error was thrown on the second iteration above - use the remainderPath
            // from the first iteration, but return nil for the error
            if (lastVal.remainderPath != "") {
                return { remainderPath: lastVal.remainderPath.split("/"), value: null };
            }
            return { remainderPath: [], value: lastVal.value };
        });
    }
}
exports.Dag = Dag;
