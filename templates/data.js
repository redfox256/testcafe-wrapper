export default {
  <% _.forEach(data, function(value) { %>
    <% _.forEach(value, function(v, k) { %>
      {{ k }}: '{{ v }}',
    <% }); %>
  <% }); %>
};
