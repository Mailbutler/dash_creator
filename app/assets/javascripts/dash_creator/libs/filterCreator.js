/*!
 * Filter Creator v1.0
 * 2017 Elie Oriol
 */

(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define([ 'jquery', 'moment' ], factory);
    }
    else if (typeof exports === 'object') { // Node/CommonJS
        module.exports = factory(require('jquery'), require('moment'));
    }
    else {
        factory(jQuery, moment);
    }
})(function($, moment) {
    var FilterCreator = function(element, options, callback) {
        this.parentEl = $(element);

        if (typeof options !== 'object' || options === null)
            options = {};

        this.models_data = (typeof options.models_data === 'object') ?
            options.models_data : {};

        this.attributes_aliases = (typeof options.attributes_aliases === 'object') ?
            options.attributes_aliases : {};

        this.displayed_model_names = (typeof options.displayed_model_names === 'object') ?
            options.displayed_model_names : {};

        this.displayed_attribute_names = (typeof options.displayed_attribute_names === 'object') ?
            options.displayed_attribute_names : {};

        this.callback = (typeof callback === 'function') ? callback : function() {};

        if (typeof options.template !== 'string' && !(options.template instanceof $)) {
            options.template = '<ul class="row" id="filters">' +
                '<button id="add-filter-btn" class="btn btn-primary pull-right">+</button>' +
                '</ul>';
        }

        this.filtersContainer = $(options.template).appendTo(this.parentEl);

        this.filtersContainer
            .on('click', '#add-filter-btn', $.proxy(this.addFilter, this))
            .on('click', '.remove-filter-btn', $.proxy(this.removeFilter, this))
            .on('focusin', '.model-select', $.proxy(this.modelSelection, this))
            .on('change', '.model-select', $.proxy(this.modelSelectionCallback, this))
            .on('change', '.attribute-select', $.proxy(this.attributeSelectionCallback, this))
            .on('click', 'input[type="radio"]', $.proxy(this.radioButtonCallback, this));
    };

    FilterCreator.prototype = {

        constructor: FilterCreator,

        // --------------- Add and remove filters ---------------
        // Add filter
        addFilter: function() {
            var last_filter = this.filtersContainer.find('.top-filter:last');
            var filter_id = last_filter.length === 0 ? 0 : parseInt(last_filter.attr("data-id")) + 1;

            var filter_field_string = '<li class="filter top-filter" data-id="' + filter_id + '" data-sublevel="0" style="width:100%; margin-bottom:50px;"> ' +
                '<div class="row">' +
                '<div class="col-md-1"> ' +
                '<span class="filter-num">' + filter_id + '</span> ' +
                '<button type="button" class="close remove-filter-btn" aria-label="Close"> ' +
                '<span aria-hidden="true">×</span> ' +
                '</button> ' +
                '</div> ' +
                '<div class="col-md-3"> ' +
                '<select name="model" class="model-select form-control">' +
                '<option value="">Choose model</option>';

            var displayed_model_names = this.displayed_model_names;
            $.each(models_data, function(model, model_data) {
                var model_name_to_display = displayed_model_names[model];
                if (typeof model_name_to_display === 'undefined')
                    model_name_to_display = model.humanize();
                filter_field_string += '<option value="' + model + '">' + model_name_to_display + '</option>';
            });

            filter_field_string += '</select>' +
                '</div> ' +
                '<div class="col-md-3"> ' +
                '<label>Number of records</label> ' +
                '<input type="number" name="num-records" min="0"> ' +
                '</div> ' +
                '<div class="col-md-4 select-attribute-div"> ' +
                '</div> ' +
                '</div> ' +
                '</li>';

            // Append to list of filters
            var filter = $(filter_field_string).appendTo(this.filtersContainer);
            if (filter.prev('.top-filter').length !== 0)
                $('<hr>').insertBefore(filter);
        },

        // Remove filter
        removeFilter: function(e) {
            var filter = $(e.target).closest(".filter");

            var prev_hr = filter.prev('hr');
            if (prev_hr.length === 0)
                filter.next('hr').remove();

            filter.prev('hr').remove();
            filter.remove();
        },


        // --------------- Model selection ---------------
        // Display models not already chosen in an other filter field
        modelSelection: function(e) {
            var target = $(e.target);

            // Get models already chosen
            var excluded_models = [];
            target.closest(".top-filter").siblings().each(function() {
                var model = $(this).find('[name="model"]').val();
                if (model !== "")
                    excluded_models.push(model);
            });

            // Show and hide the right options
            target.find("option").each(function() {
                ($.inArray($(this).val(), excluded_models) === -1) ? $(this).show() : $(this).hide();
            });
        },

        // Callback on model selection
        modelSelectionCallback: function(e) {
            var target = $(e.target);

            // Get filter
            var filter = target.closest(".top-filter");

            // Remove stuff if there is already a field from a previous model choice
            filter.find(".attribute-select").remove();
            filter.find(".attribute-options:first").remove();

            // Get model & append to filter field if non empty value
            var model = target.val();
            if (model !== '') {
                var attribute_select_string = this.createAttributeSelectString(model);
                $(attribute_select_string).appendTo(filter.find('.select-attribute-div'));
            }
        },

        createAttributeSelectString: function(model) {
            var attribute_select_string = '<select name="attributes" multiple="multiple" class="attribute-select form-control">';

            // Add attributes options to select field
            var displayed_attribute_names = this.displayed_attribute_names[model];
            $.each(this.models_data[model], function(idx, str) {
                var str_arr = str.split('-');
                var attribute = str_arr[0], type = str_arr[1];

                var attribute_name_to_display = (typeof displayed_attribute_names === 'undefined') ? undefined : displayed_attribute_names[attribute];
                if (typeof attribute_name_to_display === 'undefined')
                    attribute_name_to_display = attribute.humanize();

                attribute_select_string += '<option value="' + attribute + '-' + type + '" >' + attribute_name_to_display;

                if (type === 'has')
                    attribute_select_string += ' (has relation)';

                if (type === 'ref')
                    attribute_select_string += ' (belongs relation)';

                attribute_select_string += '</option>';
            });

            attribute_select_string += '</select>';

            return attribute_select_string;
        },


        // --------------- Attribute selection ---------------
        attributeSelectionCallback: function(e) {
            var target = $(e.target);

            var filter = target.closest(".filter");

            // Get the filter nesting sublevel from above sublevel
            var sublevel = parseInt(filter.attr("data-sublevel")) + 1;

            // Append a new list for the attributes if it does not exist
            var parent_div = filter.find('.attribute-options[data-sublevel="' + sublevel + '"]');
            if (parent_div.length === 0) {
                var options_div_string = '<ul class="col-md-10 offset-md-2 attribute-options" data-sublevel="' + sublevel + '"></ul>';
                parent_div = $(options_div_string).appendTo(filter);
            }

            // Add field for each selected attribute
            var values = target.val();
            if (values === null)
                values = [];
            var selected_values = [];     // Used to after remove eventual non kept previous attributes

            var creator = this;
            var model = 'Email';
            var displayed_attribute_names = this.displayed_attribute_names[model];
            values.forEach(function(s) {
                // Get name and type of field
                var arr = s.split('-');
                var attribute = arr[0], type = arr[1];
                selected_values.push(attribute);

                // Next if field already exists
                if (parent_div.find('.filter[data-attribute="' + attribute + '"][data-sublevel="' + sublevel + '"]').length !== 0)
                    return false;

                // Append a list element and add to filters data
                var parent_string = '<li class="filter" data-sublevel="' + sublevel + '" data-attribute="' + attribute + '" style="width: 100%"></li>';
                var parent = $(parent_string).appendTo(parent_div);

                // Provide name to display
                // FIND MODEL FROM UPPER SUBLEVEL : case top filter and case sub filter
                var attribute_name_to_display = (typeof displayed_attribute_names === 'undefined') ? undefined : displayed_attribute_names[attribute];
                if (typeof attribute_name_to_display === 'undefined')
                    attribute_name_to_display = attribute.humanize();

                // Switch case depending on attribute type to get HTML to append
                switch(type) {
                    case 'datetime':
                        creator.addDatetimeAttribute(parent, attribute_name_to_display);
                        parent.attr("data-type", "datetime");
                        break;

                    case 'text':
                        creator.addTextAttribute(parent, attribute_name_to_display);
                        parent.attr("data-type", "text");
                        break;

                    case 'ref':
                        creator.addRefAttribute(parent, attribute_name_to_display);
                        parent.attr("data-type", "ref");
                        break;

                    case 'has':
                        creator.addHasAttribute(parent, attribute_name_to_display);
                        parent.attr("data-type", "has");
                        break;

                    case 'numeric':
                        creator.addNumericAttribute(parent, attribute_name_to_display);
                        parent.attr("data-type", "numeric");
                        break;

                    case 'boolean':
                        creator.addBooleanAttribute(parent, attribute_name_to_display);
                        parent.attr("data-type", "boolean");
                        break;

                    default:
                        creator.addErrorMessage(parent, attribute_name_to_display, type);
                        parent.attr("data-type", "error");
                        break;
                }
            });

            // Remove all fields that are not selected anymore
            parent_div.find('.filter[data-sublevel="' + sublevel + '"]').each(function() {
                if ($.inArray($(this).attr("data-attribute"), selected_values) === -1)
                    $(this).remove();
            });
        },


        // --------------- Add type attributes ---------------
        addDatetimeAttribute: function(parent, attribute_name_to_display) {
            var attribute = parent.attr("data-attribute"),
                sublevel = parent.attr("data-sublevel"),
                filter_id = parent.closest('.top-filter').attr("data-id");

            // Append (empty) daterangepicker
            var label = attribute_name_to_display + ' in range';
            var daterange_input_string = '<label for="daterange">' + label + '</label>'
                + '<div class="daterange" data-id="' + filter_id + '" data-attribute="' + attribute + '" data-sublevel="' + sublevel + '" style="background: #fff; cursor: pointer; padding: 5px 10px; border: 1px solid #ccc; width: 100%">'
                + '<i class="glyphicon glyphicon-calendar fa fa-calendar"></i>&nbsp;'
                + '<span class="daterange-value"></span>'
                + '<b class="caret"></b>'
                + '</div>';
            var daterange_input = $(daterange_input_string + '<hr>').appendTo(parent);

            // Customize daterangepicker
            var creator = this;
            $(function() {
                // Default start, end
                var start = moment().subtract(29, 'days');
                var end = moment();

                // Change date format
                function cb(start, end) {
                    creator.filtersContainer.find('div[data-id="' + filter_id + '"][data-sublevel="'+ sublevel + '"][data-attribute="' + attribute + '"] span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
                }

                // Set as daterangepicker with different defaults
                daterange_input.daterangepicker({
                    startDate: start,
                    endDate: end,
                    ranges: {
                        'Today': [moment(), moment()],
                        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                        'This Month': [moment().startOf('month'), moment().endOf('month')],
                        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
                    }
                }, cb);

                cb(start, end);
            });
        },

        addTextAttribute: function(parent, attribute_name_to_display) {
            var attribute = parent.attr("data-attribute");
            var count = this.filtersContainer.find('.filter').length;

            // Empty or not choice
            var radio_button_string = '<input class="form-control" type="radio" name="present-' + attribute + '-' + count + '" value="';
            var text_field_string = '<label for="radio">' + attribute_name_to_display + '</label><br>'
                + radio_button_string + 'false' + '"> Empty'
                + radio_button_string + 'true' + '" checked="checked"> Not empty <br>';

            // Search if string/text contains string
            text_field_string += '<label>Contains ?</label>'
                + '<input class="form-control" type="text" name="contains">';

            // Append attribute filter field
            $(text_field_string + '<hr>').appendTo(parent);
        },

        addRefAttribute: function(parent, attribute_name_to_display) {
            var attribute = parent.attr("data-attribute");
            var count = this.filtersContainer.find('.filter').length;

            // Belongs to or not choice
            var radio_button_string = '<input class="form-control" type="radio" name="ref-' + attribute + '-' + count + '" value="';
            var ref_field_string = '<label for="radio">' + attribute_name_to_display + '</label><br>'
                + radio_button_string + 'true' + '" checked="checked"> Belongs to'
                + radio_button_string + 'false' + '"> Does not belong to <br>';

            // Add object attributes filters
            var alias = this.attributes_aliases[attribute];
            attribute = (typeof alias === 'undefined') ? attribute : alias;
            ref_field_string += '<br>' + this.createAttributeSelectString(attribute.classify());

            // Append attribute filter field
            $(ref_field_string + '<hr>').appendTo(parent);
        },

        addHasAttribute: function(parent, attribute_name_to_display) {
            var attribute = parent.attr("data-attribute");
            var count = this.filtersContainer.find('.filter').length;

            // Has or not choice
            var radio_button_string = '<input class="form-control" type="radio" name="has-' + attribute + '-' + count + '" value="';
            var has_field_string = '<label for="radio">' + attribute_name_to_display + '</label><br>'
                + radio_button_string + 'true' + '" checked="checked"> Has'
                + radio_button_string + 'false' + '"> Does not have <br>';

            // Add number of objects
            has_field_string += '<label>Number of ' + attribute_name_to_display + ' in range </label>'
                + '<input class="form-control" type="number" name="has-inf" min="1">'
                + '<input class="form-control" type="number" name="has-sup" min="1">';

            // Add objects attributes filters
            var alias = this.attributes_aliases[attribute];
            attribute = (typeof alias === 'undefined') ? attribute : alias;
            has_field_string += '<br>' + this.createAttributeSelectString(attribute.classify());

            // Append attribute filter field
            $(has_field_string + '<hr>').appendTo(parent);
        },

        addNumericAttribute: function(parent, attribute_name_to_display) {
            var attribute = parent.attr("data-attribute");
            var count = this.filtersContainer.find('.filter').length;

            var numeric_field_string = '<label>' + attribute_name_to_display + '</label><br>',
                radio_button_string = '<input class="form-control" type="radio" name="value-' + attribute + '-' + count + '" value="';

            switch(attribute.classify()) {
                case 'Status':
                    // ??? emails (sent or not ?) & tasks (finished or not)
                    break;

                case 'SharingStatus':
                    numeric_field_string += radio_button_string + '0' + '"> Not shared'
                        + radio_button_string + '1' + '"> Shared in team'
                        + radio_button_string + '2' + '"> Shared in company <br>';
                    break;

                case 'State':
                    numeric_field_string += radio_button_string + '0' + '"> Temporary'
                        + radio_button_string + '1' + '"> Unverified'
                        + radio_button_string + '2' + '"> Verified <br>';
                    break;

                case 'TemplateType':
                    numeric_field_string += radio_button_string + '0' + '"> Snippet'
                        + radio_button_string + '1' + '"> Template <br>';
                    break;

                case 'TriggerCount':
                    numeric_field_string += '<input class="form-control" type="number" name="inf" min="0">'
                        + '<input class="form-control" type="number" name="sup" min="0">';
                    break;

                default:
                    break;
            }

            // Append attribute filter field
            $(numeric_field_string + '<hr>').appendTo(parent);
        },

        addBooleanAttribute: function(parent, attribute_name_to_display) {
            var attribute = parent.attr("data-attribute");
            var count = this.filtersContainer.find('.filter').length;

            // Has or not choice
            var radio_button_string = '<input class="form-control" type="radio" name="value-' + attribute + '-' + count + '" value="';
            var boolean_field_string = '<label for="radio">' + attribute_name_to_display + '</label><br>'
                + radio_button_string + 'true' + '" checked="checked"> True'
                + radio_button_string + 'false' + '"> False <br>';

            // Append attribute filter field
            $(boolean_field_string + '<hr>').appendTo(parent);
        },

        addErrorMessage: function(parent, attribute_name_to_display, type) {
            var attribute = parent.attr("data-attribute");

            var error_message = '<label>' + attribute_name_to_display + ': type ' + type + ' is not handled</label><br>';

            // Append error message
            $(error_message + '<hr>').appendTo(parent);
        },


        // --------------- Radio buttons show/hide ---------------
        radioButtonCallback: function(e) {
            var target = $(e.target);

            var name = target.attr("name");
            var value = target.attr("value");
            target.siblings('').not('input[name="' + name + '"]').not('label[for="radio"]').not('br').each(function() {
                (value === "false") ? $(this).hide() : $(this).show();
            });
        },


        // --------------- Prepare data ---------------
        getFiltersData: function() {
            // Format the sent data
            var filters_data = {};

            // Add all filtered models
            var creator = this;
            this.filtersContainer.find('.filter[data-sublevel="0"]').each(function() {
                var model = $(this).find('[name="model"]').val();
                var num_records = $(this).find('[name="num-records"]').val();

                if (model !== "") {
                    // Create subdata for model
                    var data = filters_data[model] = {};

                    // Add number of records for model
                    data['num_records'] = num_records;

                    // Add data from child ul (recursive call)
                    var attribute_options = $(this).find('.attribute-options[data-sublevel="1"]');
                    if (attribute_options.length !== 0) {
                        creator.getSublevelData(data, attribute_options);
                    }
                }
            });

            return JSON.parse(JSON.stringify(filters_data));
        },

        getSublevelData: function(data, attribute_options) {
            var creator = this;

            var sublevel = attribute_options.attr("data-sublevel");

            attribute_options.find('.filter[data-sublevel="' + sublevel + '"]').each(function() {
                // Get attribute and create subdata with it
                var attribute = $(this).attr("data-attribute"), data_type = $(this).attr("data-type");
                var subdata = data[attribute] = {type: data_type};

                // Recurse through sublevel if there is a child ul
                attribute_options = $(this).find('.attribute-options[data-sublevel="' + (parseInt(sublevel) + 1) + '"]');
                if (attribute_options.length !== 0) {
                    creator.getSublevelData(subdata, attribute_options);
                }

                // TODO: Handle json
                $(this).children("input").each(function() {
                    var name = $(this).attr("name");

                    switch ($(this).attr("type")) {
                        case 'radio':
                            // Add the value of the checked radio button (redundant but not a big deal)
                            var checked_radio_btn = $(this).siblings('input[name="' + name + '"]:checked');
                            if (checked_radio_btn.length !== 0)
                                subdata[name.split('-')[0]] = checked_radio_btn.val();
                            break;

                        case 'number':
                        case 'text':
                            // Add value if any
                            var value = $(this).val();
                            if (typeof value !== 'undefined' && value !== "" && value !== null)
                                subdata[name] = value;
                            break;

                        default:
                            break;
                    }
                });

                // Add daterange if any
                var daterange_value = $(this).children(".daterange").find(".daterange-value").text();
                if (typeof daterange_value !== 'undefined' && daterange_value !== "") {
                    var startend = daterange_value.split(' - ');
                    subdata['start'] = startend[0];
                    subdata['end'] = startend[1];
                }
            });
        },


        // --------------- Build filters from data ---------------
        buildFilters: function(data) {
            var creator = this;
            creator.filtersContainer.children('.top-filter').remove();
            $.each(data, function(model_name, model_attributes_hash) {
                creator.buildModel(model_name, model_attributes_hash);
            });
        },

        buildModel: function(model_name, model_attributes_hash) {
            var creator = this;

            creator.addFilter();
            var new_filter = this.filtersContainer.find('.top-filter:last');
            new_filter.find('.model-select:last').val(model_name).change();

            var num_records = model_attributes_hash['num_records'];
            new_filter.find('[name="num-records"]:last').val(num_records).change();

            creator.buildSelectAttributes(new_filter, model_attributes_hash);

            $.each(model_attributes_hash, function(attribute_name, attribute_hash) {
                var sub_filter = new_filter.find('.filter[data-attribute="' + attribute_name + '"]');
                creator.buildAttribute(sub_filter, attribute_hash);
            });
        },

        buildSelectAttributes: function(filter, model_attributes_hash) {
            var attributes_values = [], not_attributes = ['num_records', 'type', 'has', 'ref', 'has-inf', 'has-sup'];
            $.each(Object.keys(model_attributes_hash), function(idx, attribute) {
                if ($.inArray(attribute, not_attributes) !== -1)
                    return true;

                attributes_values.push(attribute + '-' + model_attributes_hash[attribute]['type']);
            });
            filter.find('.attribute-select:last').val(attributes_values).change();
        },

        buildAttribute: function(filter, attribute_hash) {
            switch(attribute_hash['type']) {
                case 'datetime':
                    this.buildDatetimeAttribute(filter, attribute_hash);
                    break;

                case 'numeric':
                    this.buildNumericAttribute(filter, attribute_hash);
                    break;

                case 'boolean':
                    this.buildBooleanAttribute(filter, attribute_hash);
                    break;

                case 'text':
                    this.buildTextAttribute(filter, attribute_hash);
                    break;

                case 'has':
                    this.buildHasAttribute(filter, attribute_hash);
                    break;

                case 'ref':
                    this.buildRefAttribute(filter, attribute_hash);
                    break;

                default:
                    break;
            }
        },

        buildDatetimeAttribute: function(filter, attribute_hash) {
            if ('start' in attribute_hash) {
                var daterange_string = attribute_hash['start'] + ' - ' + attribute_hash['end'];
                filter.find('.daterange-value').text(daterange_string);
            }
        },

        buildNumericAttribute: function(filter, attribute_hash) {
            if ('value' in attribute_hash) {
                var value = attribute_hash['value'];
                filter.find('[value="' + value + '"]:first').click();
            }
            if ('inf' in attribute_hash) {
                var inf = attribute_hash['inf'];
                filter.find('[name="inf"]:first').val(inf);
            }
            if ('sup' in attribute_hash) {
                var sup = attribute_hash['sup'];
                filter.find('[name="sup"]:first').val(sup);
            }
        },

        buildBooleanAttribute: function(filter, attribute_hash) {
            if ('value' in attribute_hash) {
                var value = attribute_hash['value'];
                filter.find('[value="' + value + '"]:first').click();
            }
        },

        buildTextAttribute: function(filter, attribute_hash) {
            if ('present' in attribute_hash) {
                var present = attribute_hash['present'];
                filter.find('[value="' + present + '"]:first').click();

                if (present === 'true' && 'contains' in attribute_hash) {
                    var contains = attribute_hash['contains'];
                    filter.find('[name="contains"]:first').val(contains);
                }
            }
        },

        buildHasAttribute: function(filter, attribute_hash) {
            if ('has' in attribute_hash) {
                var has = attribute_hash['has'];
                filter.find('[value="' + has + '"]:first').click();

                if (has === 'true' && 'has-inf' in attribute_hash) {
                    var has_inf = attribute_hash['has-inf'];
                    filter.find('[name="has-inf"]:first').val(has_inf);
                }
                if (has === 'true' && 'has-sup' in attribute_hash) {
                    var has_sup = attribute_hash['has-sup'];
                    filter.find('[name="has-sup"]:first').val(has_sup);
                }
            }

            var creator = this;
            creator.buildSelectAttributes(filter, attribute_hash);

            var not_attributes = ['num_records', 'type', 'has', 'ref', 'has-inf', 'has-sup'];
            $.each(attribute_hash, function(attribute_name, sub_attribute_hash) {
                if ($.inArray(attribute_name, not_attributes) === -1) {
                    var sub_filter = filter.find('.filter[data-attribute="' + attribute_name + '"]');
                    creator.buildAttribute(sub_filter, sub_attribute_hash);
                }
            });
        },

        buildRefAttribute: function(filter, attribute_hash) {
            if ('ref' in attribute_hash) {
                var ref = attribute_hash['ref'];
                filter.find('[value="' + ref + '"]:first').click();
            }

            var creator = this;
            creator.buildSelectAttributes(filter, attribute_hash);

            var not_attributes = ['num_records', 'type', 'has', 'ref', 'has-inf', 'has-sup'];
            $.each(attribute_hash, function(attribute_name, sub_attribute_hash) {
                if ($.inArray(attribute_name, not_attributes) === -1) {
                    var sub_filter = filter.find('.filter[data-attribute="' + attribute_name + '"]');
                    creator.buildAttribute(sub_filter, sub_attribute_hash);
                }
            });
        }
    };

    $.fn.filterCreator = function(options, callback) {
        this.each(function(i, _element) {
            var el = $(_element);
            if (el.data('filterCreator'))
                el.data('filterCreator').remove();
            el.data('filterCreator', new FilterCreator(el, options, callback));
        });
        return this;
    };

    // String function helpers
    String.prototype.capitalizedArray = function() {
        var arr = this.split('_');
        if (arr[arr.length - 1] === 'id')
            arr.pop();

        for (var i = 0; i < arr.length; i++) {
            arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
        }
        return arr;
    };

    String.prototype.underscore = function(){
        return this.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();}).replace(/^_/, "");
    };

    String.prototype.humanize = function(){
        return this.underscore().capitalizedArray().join(' ');
    };

    String.prototype.classify = function(){
        return this.capitalizedArray().join('');
    };

    return FilterCreator;
});