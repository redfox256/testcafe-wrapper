export default {
  <% _.forEach(data, function(value, key) { %>
       <% if (value instanceof Array) { %>
           {{ key }}: {
           <% _.forEach(value, function(pValue, pKey) { %>
               <% if (pValue.substr(0, 1).match(/[0-9]/g)) { %>
                   _{{ _.trim(_.camelCase(pValue)) }}: '{{ pValue }}',
               <% } else { %>
                   {{ _.camelCase(pValue) }}: '{{ pValue }}',
               <% } %>
           <% }); %>
           },
       <% } else { %>
           {{ key }}: '{{ value }}',
       <% } %>
  <% }); %>
};
