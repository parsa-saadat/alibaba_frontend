import assert from 'node:assert/strict';
import {attributePayload,editableAttributes,validAttributes,displayAttributes} from '../src/utils/helpers/attributes.mjs';
import {seedContent,contentPayload} from '../src/i18n/content-model.mjs';
const rows=editableAttributes([{name:'Legacy name',value:'Legacy value'}]);assert.deepEqual(rows,[{name:{en:'Legacy name'},value:{en:'Legacy value'}}]);
rows[0].name.fa='نام';rows[0].value.fa='مقدار';const payload=attributePayload(rows);assert.ok(validAttributes(payload));assert.deepEqual(displayAttributes(payload,'fa'),[{name:'نام',value:'مقدار'}]);assert.deepEqual(displayAttributes(payload,'tr'),[{name:'Legacy name',value:'Legacy value'}]);assert.equal(rows[0].name.tr,undefined,'display fallback must not write translation');
assert.ok(!validAttributes([{name:{en:'Name'},value:{fa:'مقدار'}}]));assert.ok(!validAttributes(Array.from({length:9},()=>rows[0])));assert.deepEqual(attributePayload([{name:{},value:{}}]),[]);
const form=seedContent({name:{en:'Category',fa:'دسته'},translations:{}},['name']);assert.equal(contentPayload(form,['name']).name,'Category');assert.equal(form.translations.fa.name,'دسته');
const nested=seedContent({translations:{en:{name:{en:'Category',fa:'دسته'}}}},['name']);assert.equal(nested.translations.en.name,'Category');
console.log('PASS V43 attribute editor maps, independent locales, nonmutating fallback, row/pair limits, field-first and legacy nested category editor seeds');
