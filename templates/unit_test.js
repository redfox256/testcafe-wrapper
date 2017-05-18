import Page from './page_objects/{{ filename }}.js';
<% if (typeof before != 'undefined' && before || undefined) { %>
import LoginPage from './page_objects/login.js';
const loginPage = new LoginPage();
<% } %>

const page = new Page();

fixture `{{ fixture }}`
    .page `{{ page }}`
<% if (typeof before != 'undefined' && before || undefined) { %>
    .beforeEach(async t => {
        console.log('running beforeEach hook');
        await loginPage.{{ before }}();
    })
<% } %>
;

<% _.forEach(tests, function(test) { %>
test('{{ test.name }}', async t => {
    console.log('running {{ test.name }}')
    await t
    <% _.forEach(test.logic, function(logic) { %>
        <% if (logic.validate) { %>
            .click(page.{{ logic.validate }});
            <% _.forEach(fields, function(field) { %>
                <% if (field.element === 'input' && (field.type === 'text' || field.type === 'password')) { %>
                    <% if (field.required) { %>
                        await t.expect(page.{{ field.identifier }}.getAttribute('title')).eql('This field is required');
                        await t.expect(true).ok(page.{{ field.identifier }}.parent('.field').hasClass('error'));
                    <% } %>
                    <% if (field.maxlength) { %>
                        await t.expect(page.{{ field.identifier }}.getAttribute('maxlength').eql(field.maxlength));
                    <% } %>
                    <% if (field.pattern) { %>
                        await t.expect(page.{{ field.identifier }}.getAttribute('pattern').eql(field.pattern));
                    <% } %>
                <% } %>
                // TODO other fields ,etc dropdowns, checkboxes
            <% }); %>
        <% } else { %>
            <% _.forEach(logic, function(step) { %>
                <% if (logic.typeText) { %>
                    .typeText(page.{{ step.identifier }}, '{{ step.text }}')
                <% } else if (logic.click) { %>
                    .click(page.{{ step.identifier }})
                <% } %>
            <% }); %>
        <% } %>
    <% }); %>
    ;
});
<% }); %>
