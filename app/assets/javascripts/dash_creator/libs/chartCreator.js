/*!
 * Chart Creator v1.0
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
    var ChartCreator = function(element, options, callback) {
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

        this.filter_creator = (typeof options.filter_creator === 'object') ?
            options.filter_creator : null;

        this.minicolors_options = (typeof options.minicolors_options === 'object') ?
            options.minicolors_options : {};

        this.callback = (typeof callback === 'function') ? callback : function() {};

        if (typeof options.template !== 'string' && !(options.template instanceof $)) {
            options.template = '<div class="row"> ' +
                '<div class="col-md-10 offset-md-1 px-2" id="chart-container" style="background-color: #eee; border-radius: 10px; padding: 20px 10px; margin-bottom: 50px;"> ' +
                '<h3>Chart Zone</h3> ' +
                '<div class="chart-wrapper" style="height:370px; margin-bottom:50px;"> ' +
                '<iframe class="chartjs-hidden-iframe" tabindex="-1" style="display: flex; overflow: hidden; border: 0; margin: 0; top: 0; left: 0; bottom: 0; right: 0; height: 100%; width: 100%; position: absolute; pointer-events: none; z-index: -1;"></iframe> ' +
                '</div> ' +
                '</div> ' +
                '<hr> ' +
                '<div class="col-md-12 px-2" id="var-container"> ' +
                '<div class="row" id="y-container"> ' +
                '<button id="add-var-btn" class="btn btn-primary pull-right">+</button> ' +
                '</div> ' +
                '<div class="row" id="x-container"> ' +
                '<div class="col-sm-12" id="x-axis-select-div" style="margin-top:40px;"> ' +
                '<div class="col-sm-2"> ' +
                '<h5>Function of</h5> ' +
                '</div> ' +
                '<div class="form-group col-sm-10"> ' +
                '<select name="x-axis" class="axis-select form-control">' +
                '<option value="">Choose data</option>' +
                '</select>' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '<hr> ' +
                '<div class="col-md-12 px-2" id="options-container"> ' +
                '<div class="row" style="margin-top:60px;"> ' +
                '<div class="col-sm-12" style="margin-bottom: 40px;"> ' +
                '<h3 style="margin-bottom: 20px;">Label Options</h3> ' +
                '<div class="row"> ' +
                '<div class="col-sm-10 offset-sm-1"> ' +
                '<div class="row" id="label-options"> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-6"> ' +
                '<h3 style="margin-bottom: 20px;">Style Options</h3> ' +
                '<div class="row"> ' +
                '<div class="col-sm-10 offset-sm-1"> ' +
                '<div class="row" id="style-options"> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-6"> ' +
                '<h3 style="margin-bottom: 20px;">Color Options</h3> ' +
                '<div class="row"> ' +
                '<div class="col-sm-10 offset-sm-1"> ' +
                '<div class="row" id="color-options"> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div>';
        }


        this.container = $(options.template).appendTo(this.parentEl);
        this.varContainer = this.container.find('#var-container');
        this.yContainer = this.varContainer.find('#y-container');
        this.xContainer = this.varContainer.find('#x-container');
        this.labelOptionsContainer = this.container.find('#label-options');
        this.styleOptionsContainer = this.container.find('#style-options');
        this.colorOptionsContainer = this.container.find('#color-options');
        this.addMainVar();

        this.varContainer
            .on('click', '#add-var-btn', $.proxy(this.addVar, this))
            .on('click', '.remove-var-btn', $.proxy(this.removeVar, this))
            .on('change', '[name="main-type"]', $.proxy(this.checkMainType, this))
            .on('focusin', '.axis-select', $.proxy(this.axisSelection, this))
            .on('change', '.axis-select', $.proxy(this.axisSelectionCallback, this));

        this.labelOptionsContainer
            .on('focusin', '.axis-select', $.proxy(this.axisSelection, this))
            .on('change', '.axis-select', $.proxy(this.axisSelectionCallback, this))
            .on('change', '#date-range-select', $.proxy(this.daterangeSelection, this))
            .on('blur', '#date-range-select', $.proxy(this.daterangeSelection, this))
            .on('change', '[name="labels-type"]', $.proxy(this.changeLabelTypeCallback, this))
            .on('change', '[name="sub-labels-type"]', $.proxy(this.changeLabelTypeCallback, this))
            .on('change', '[name="labels-num"]', $.proxy(this.changeLabelsNumCallback, this));

        // Adjust number of color inputs in style options
        this.container
            .on('change', 'select', $.proxy(this.colorCallback, this))
            .on('blur', 'select', $.proxy(this.colorCallback, this))
            .on('change', 'input', $.proxy(this.colorCallback, this))
            .on('click', 'input[type="radio"]', $.proxy(this.colorCallback, this));
    };

    ChartCreator.prototype = {

        constructor: ChartCreator,

        // --------------- Initialize main components ---------------
        addMainVar: function() {
            this.addMainVarToCreator();
            this.addMainStyleToCreator();
            this.addMainColorToCreator();
            this.xContainer.find('#x-axis-select-div').hide();
        },

        addMainVarToCreator: function() {
            var main_var_string = '<div class="col-sm-12 var-div" data-id="0"> ' +
                '<div class="row"> ' +
                '<div class="col-sm-12"> ' +
                '<h5>Main variable</h5> ' +
                '</div> ' +
                '<div class="form-group col-sm-3 offset-sm-1"> ' +
                '<select name="y-axis" class="axis-select form-control">' +
                '<option value="">Choose main data</option>' +
                '</select>' +
                '</div> ' +
                '<div class="form-group col-sm-3 offset-sm-1"> ' +
                '<input type="text" name="dataset-label" class="form-control"> ' +
                '</div> ' +
                '<div class="form-group col-sm-3 offset-sm-1"> ' +
                '<select name="main-type" class="type-select form-control">' +
                '<option value="line">Line</option>' +
                '<option value="bar">Bar</option>' +
                '<option value="pie">Pie</option>' +
                '<option value="doughnut">Doughnut</option>' +
                '<option value="polar">Polar</option>' +
                '<option value="radar">Radar</option>' +
                '</select>' +
                '</div> ' +
                '</div> ' +
                '</div> ';

            $(main_var_string).prependTo(this.yContainer);
        },

        addMainStyleToCreator: function() {
            var main_style_string = '<div class="col-sm-12 var-style-div" data-id="0"> ' +
                '<div class="row"> ' +
                '<div class="col-sm-12" style="margin-bottom: 20px;"> ' +
                '<div class="row" id="style-general"> ' +
                '<div class="col-sm-12"> ' +
                '<strong>General</strong> ' +
                '</div> ' +
                '<div class="col-sm-12" id="title-div"> ' +
                '<div class="form-group"> ' +
                '<label for="title">Title</label> ' +
                '<input type="text" name="title" id="title" class="form-control"> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-12" id="legend-div"> ' +
                '<div class="row"> ' +
                '<div class="col-sm-3"> ' +
                '<div class="form-group"> ' +
                '<label for="legend">Display legend</label> ' +
                '<input type="checkbox" name="legend" class="form-control" checked="checked"> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-9"> ' +
                '<div class="form-group"> ' +
                '<label for="legend-pos">Legend Position</label> ' +
                '<select name="legend-pos" class="form-control"> ' +
                '<option value="top">Top</option> ' +
                '<option value="right">Right</option> ' +
                '<option value="bottom">Bottom</option> ' +
                '<option value="left">Left</option> ' +
                '</select> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-12" style="margin-bottom: 20px;"> ' +
                '<div class="row" id="style-barline"> ' +
                '<div class="col-sm-12"> ' +
                '<strong>Bar/Line chart</strong> ' +
                '</div> ' +
                '<div class="col-sm-12" id="grid-div"> ' +
                '<div class="row"> ' +
                '<div class="col-sm-6"> ' +
                '<div class="form-group"> ' +
                '<label for="x-grid-lines">Vertical grid lines</label> ' +
                '<input type="checkbox" name="x-grid-lines" class="form-control" checked="checked"> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-6"> ' +
                '<div class="form-group"> ' +
                '<label for="y-grid-lines">Horizontal</label> ' +
                '<input type="checkbox" name="y-grid-lines" class="form-control" checked="checked"> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-12" id="y-axis-div"> ' +
                '<div class="row"> ' +
                '<div class="col-sm-4"> ' +
                '<div class="form-group"> ' +
                '<label for="y-axis-min">Y Axis Min</label> ' +
                '<input type="number" name="y-axis-min" class="form-control"> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-4"> ' +
                '<div class="form-group"> ' +
                '<label for="y-axis-min">Max</label> ' +
                '<input type="number" name="y-axis-max" class="form-control"> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-4"> ' +
                '<div class="form-group"> ' +
                '<label for="y-axis-min">Step</label> ' +
                '<input type="number" name="y-axis-step" class="form-control"> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-12" id="labeling-step-div"> ' +
                '<div class="form-group"> ' +
                '<label for="labeling-step">X Axis Labeling step</label> ' +
                '<input type="number" name="labeling-step" class="form-control" min="1" value="1"> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-12" id="stacked-div"> ' +
                '<div class="form-group"> ' +
                '<label for="stacked">Stacked</label> ' +
                '<input type="checkbox" name="stacked" class="form-control"> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ';

            $(main_style_string).appendTo(this.styleOptionsContainer);
        },

        addMainColorToCreator: function() {
            var main_color_string = '<div class="col-sm-12 color-div" data-id="0" id="main-color" style="margin-bottom: 20px;">' +
                '<div class="row" id="main-color"> ' +
                '<div class="col-sm-6"> ' +
                '<div class="form-group color-group"> ' +
                '<label for="dataset-color">Main variable color</label>' +
                '<input type="text" name="dataset-color" class="form-control"> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-6"> ' +
                '<div class="form-group transparency-group"> ' +
                '<label for="transparency">Area transparency</label> ' +
                '<input type="range" name="transparency" value="0" step="1" class="form-control"> ' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';

            var main_color_div = $(main_color_string).appendTo(this.colorOptionsContainer);
            // Set first swatches color
            var default_color = this.minicolors_options.swatches[0];
            main_color_div.find('[name="dataset-color"]').minicolors(this.minicolors_options).val(default_color).change();
            main_color_div.find('.minicolors-input-swatch .minicolors-swatch-color').css("background-color", default_color);
        },


        // --------------- Variables handling ---------------
        addVar: function() {
            var last_var_div = this.yContainer.find('.var-div:last');
            var var_id = parseInt(last_var_div.attr('data-id')) + 1;

            this.addVarToCreator(var_id);
            this.checkMainType();
            this.addStyleToCreator(var_id);
        },

        addVarToCreator: function(var_id) {
            var var_div_string = '<div class="col-sm-12 var-div" data-id="' + var_id + '" style="margin-top:20px;">'
                + '<div class="row">'
                + '<div class="col-sm-12">'
                + '<h5>Variable ' + var_id + '</h5>'
                + '</div>'
                + '<div class="col-sm-1">'
                + '<button type="button" class="close remove-var-btn" aria-label="Close">'
                + '<span aria-hidden="true">×</span>'
                + '</button>'
                + '</div>'
                + '<div class="form-group col-sm-3">' +
                '<select name="y-axis" class="axis-select form-control">' +
                '<option value="">Choose data</option>' +
                '</select>'
                + '</div>'
                + '<div class="form-group col-sm-3 offset-sm-1">'
                + '<input type="text" name="dataset-label" class="form-control">'
                + '</div>'
                + '<div class="form-group col-sm-3 offset-sm-1">' +
                '<select name="type" class="type-select form-control">' +
                '<option value="line">Line</option>' +
                '<option value="bar">Bar</option>' +
                '</select>'
                + '</div></div></div>';

            $(var_div_string).appendTo(this.yContainer);
        },

        addStyleToCreator: function(var_id) {
            var var_style_div_string = '<div class="col-sm-12 var-style-div" data-id="' + var_id + '"></div>';
            $(var_style_div_string).appendTo(this.styleOptionsContainer);

            this.addColorToCreator(var_id, 0);
        },

        addColorToCreator: function(var_id, label_num) {
            var label;
            var is_not_var_color = var_id === 0;
            if (is_not_var_color)
                label = 'Label ' + label_num + ' color';
            else
                label = 'Variable ' + var_id + ' color';

            var color_div_string = '<div class="col-sm-12 color-div" data-id="' + var_id + '" style="margin-bottom: 20px;">' +
                '<div class="row"> ' +
                '<div class="col-sm-6"> ' +
                '<div class="form-group color-group"> ' +
                '<label for="dataset-color">' + label + '</label>' +
                '<input type="text" name="dataset-color" class="form-control"> ' +
                '</div> ' +
                '</div> ' +
                '<div class="col-sm-6"> ' +
                '<div class="form-group transparency-group"> ' +
                '<label for="transparency">Area transparency</label> ' +
                '<input type="range" name="transparency" value="0" step="1" class="form-control"> ' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';

            var color_div = $(color_div_string).appendTo(this.colorOptionsContainer);

            // Set a default color
            var swatches = this.minicolors_options.swatches;
            var num = label_num === 0 ? var_id : label_num;
            var default_color = swatches[num % swatches.length];
            color_div.find('[name="dataset-color"]').minicolors(this.minicolors_options).val(default_color).change();
            color_div.find('.minicolors-input-swatch .minicolors-swatch-color').css("background-color", default_color);
        },

        removeVar: function(e) {
            var target = $(e.target);

            var var_div = target.closest('.var-div');
            var id = var_div.attr("data-id");
            this.container.find('[data-id="' + id + '"]').remove();
        },

        checkMainType: function() {
            var main_type = this.yContainer.find('[name="main-type"]').val();

            if (main_type === 'bar' || main_type === 'line') {
                this.yContainer.find('[name="type"]').show();
                this.styleOptionsContainer.find('#style-barline').show();
            }
            else {
                this.yContainer.find('[name="type"]').hide();
                this.styleOptionsContainer.find('#style-barline').hide();
            }

            return main_type;
        },


        // --------------- Selection callbacks ---------------
        axisSelection: function(e) {
            var target = $(e.target);

            var select_name = target.attr("name");

            // Remove previous options
            target.children('option').not('[value=""]').remove();

            // Different handling for main or second variable
            if (select_name === 'y-axis')
                this.fillYAxisSelect(target);
            else if (select_name === 'x-axis')
                this.fillXAxisSelect(target);
            else
                this.fillXSubSelect(target);
        },

        fillYAxisSelect: function(select) {
            var options_string = '';

            // Take models from filters if associated with filter_creator
            var displayed_model_names = this.displayed_model_names;
            if (this.filter_creator !== null) {
                this.filter_creator.find('.top-filter').each(function() {
                    var filter_id = $(this).attr("data-id");
                    var model = $(this).find('[name="model"]').val();
                    if (model !== '') {
                        var model_name_to_display = displayed_model_names[model];
                        if (typeof model_name_to_display === 'undefined')
                            model_name_to_display = model.humanize();
                        options_string += '<option value="' + model + '">Filter ' + filter_id + ': ' + model_name_to_display + '</option>';
                    }
                });
            }
            else {
                $.each(this.models_data, function(model, attributes) {
                    var model_name_to_display = displayed_model_names[model];
                    if (typeof model_name_to_display === 'undefined')
                        model_name_to_display = model.humanize();
                    options_string += '<option value="' + model + '">' + model_name_to_display + '</option>';
                });
            }

            // Append options to select
            $(options_string).appendTo(select);
        },

        fillXAxisSelect: function(select) {
            var options_string = '';
            var attributes_aliases = this.attributes_aliases;

            // Get model data
            var y_vals = [];
            this.yContainer.find('[name="y-axis"]').each(function() {
                var model = $(this).val().split('-')[0];
                var alias = attributes_aliases[model];
                model = (typeof alias === 'undefined') ? model : alias;
                y_vals.push(model.classify());
            });
            var model_data = this.yAxesDataInCommon(y_vals);

            // Get list of filtered models
            var filtered_models = [];
            if (this.filter_creator !== null) {
                this.filter_creator.find('.top-filter').each(function() {
                    var model = $(this).find('[name="model"]').val();
                    if (model !== '')
                        filtered_models.push(model);
                });
            }

            var filter_creator = this.filter_creator;
            var displayed_attribute_names = this.displayed_attribute_names[y_vals[0]];
            $.each(model_data, function(idx, str) {
                var key = str.split('-')[0], value = str.split('-')[1];

                // Create option string for each attribute
                var key_name_to_display = (typeof displayed_attribute_names === 'undefined') ? undefined : displayed_attribute_names[key];
                if (typeof key_name_to_display === 'undefined')
                    key_name_to_display = key.humanize();

                var new_option_string = '<option value="' + key + '-' + value + '">' + key_name_to_display;
                if (value === 'has')
                    new_option_string += ' (has relation)';
                if (value === 'ref')
                    new_option_string += ' (belongs relation)';

                // If attribute is a related model that is filtered, copy the option to have filtered or not version
                var alias = attributes_aliases[key];
                var key_model = (typeof alias === 'undefined') ? key : alias;
                if ($.inArray(key_model.classify(), filtered_models) !== -1) {
                    new_option_string += '</option>' +
                        '<option value="' + key + '-' + value + '-filter">' + key_name_to_display;

                    var filters_model_selects = filter_creator.find('[name="model"]');
                    filters_model_selects.each(function() {
                        var model = $(this).val();
                        if (model === key_model.classify()) {
                            var filter_id = $(this).closest('.top-filter').attr("data-id");
                            new_option_string += ' (Filter ' + filter_id + ')';
                        }
                    });
                }
                options_string += new_option_string + '</option>';
            });

            // Append options to select
            $(options_string).appendTo(select);
        },

        fillXSubSelect: function(select) {
            var options_string = '';

            // Get model data
            var x_model = this.xContainer.find('[name="x-axis"]').val().split('-')[0];
            var alias = this.attributes_aliases[x_model];
            x_model = (typeof alias === 'undefined') ? x_model : alias;
            var model_data = this.models_data[x_model.classify()];

            var plotting_types = ['text', 'numeric', 'boolean', 'datetime'];
            var displayed_attribute_names = this.displayed_attribute_names[x_model.classify()];
            $.each(model_data, function(idx, str) {
                var key = str.split('-')[0], value = str.split('-')[1];
                // Get types that can be used for plotting
                if ($.inArray(value, plotting_types) === -1) return true;

                var key_name_to_display = (typeof displayed_attribute_names === 'undefined') ? undefined : displayed_attribute_names[key];
                if (typeof key_name_to_display === 'undefined')
                    key_name_to_display = key.humanize();

                // Create option string for each attribute
                options_string += '<option value="' + key + '-' + value + '">' + key_name_to_display + '</option>';
            });

            // Append options to select
            $(options_string).appendTo(select);
        },

        yAxesDataInCommon: function(models) {
            var models_data = this.models_data;

            var first_model_data = models_data[models[0]];
            if (models.length === 1)
                return first_model_data;

            var final_data = [];
            $.each(models, function(index, model) {
                if (index === 0) return true;

                $.each(first_model_data, function(idx, str) {
                    if ($.inArray(str, models_data[model]) !== -1) final_data.push(str);
                });
            });

            return final_data;
        },

        axisSelectionCallback: function(e) {
            var target = $(e.target);

            var select_name = target.attr("name");
            var attribute = target.val().split('-')[0], attribute_type = target.val().split('-')[1];
            if (select_name === 'y-axis') {
                target.closest('.var-div').find('[name="dataset-label"]').val(attribute);
                this.showXAxisSelect();
            }
            else {
                // Hide if empty value (prompt value)
                if (attribute === '') {
                    if (select_name === 'x-axis')
                        this.labelOptionsContainer.children().not('#label').hide();
                    else
                        this.labelOptionsContainer.children().not('#label').not('#label-type-radio-div').remove();
                    return;
                }
                this.showLabelOptions(select_name, attribute_type);
            }
        },

        showXAxisSelect: function() {
            if (this.yContainer.find('[name="y-axis"]').first().val() === '') {
                this.xContainer.find('#x-axis-select-div').hide();
                this.labelOptionsContainer.children().not('#label').remove();
            }
            else this.xContainer.find('#x-axis-select-div').show();
        },

        showLabelOptions: function(select_name, attribute_type) {
            // Otherwise show and remove previous options
            this.labelOptionsContainer.children().show();
            var is_sub = false;
            if (select_name === 'x-sub' && this.labelOptionsContainer.find('[name="labels-type"]:checked').val() === 'attribute') {
                this.labelOptionsContainer.children().not('#label-type-radio-div').not('#label').remove();
                is_sub = true;
            }
            else
                this.labelOptionsContainer.children().not('#label').remove();

            // Display according to attribute type
            switch(attribute_type) {
                case 'datetime':
                    this.showDatetimeLabelOptions();
                    break;

                case 'numeric':
                    this.showNumericLabelTypes(is_sub);
                    break;

                case 'boolean':
                    this.showBooleanLabelOptions(is_sub);
                    break;

                case 'text':
                    this.showTextLabelTypes(is_sub);
                    break;

                case 'ref':
                    this.showRefLabelTypes(is_sub);
                    break;

                case 'has':
                    this.showHasLabelTypes(is_sub);
                    break;

                default:
                    this.showErrorMessage(is_sub, attribute_type);
                    break;
            }

            // Add options to page and change labels number to display further options
            if (!is_sub)
                this.labelOptionsContainer.find('#label-type-radio-div').find('[type="radio"]:first').click();
            else
                this.labelOptionsContainer.find('#sub-label-type-radio-div').find('[type="radio"]:first').click();
        },

        showDatetimeLabelOptions: function() {
            this.labelOptionsContainer.find('#sub-label-type-radio-div').remove();

            // Select input for date range
            var date_range_options = [
                'Today',
                'Yesterday',
                'Last 7 Days',
                'This Week',
                'Last Week',
                'Last 30 Days',
                'This Month',
                'Last Month',
                'Last 365 Days',
                'This Year',
                'Last Year',
                'Fixed Date Range'
            ];
            var date_range_select_string = '<select name="date_range" id="date-range-select" class="form-control">' +
                '<option value="">Choose a date range</option>';
            $.each(date_range_options, function(index, daterange) {
                date_range_select_string += '<option value="' + daterange + '">' + daterange + '</option>';
            });
            date_range_select_string += '</select>';

            var options_string = '<div class="col-sm-6">'
                + '<div class="form-group">'
                + '<label>Date range</label>'
                + date_range_select_string
                + '</div></div>';

            // Choose period plot : day, week, month
            options_string += '<div class="col-sm-2">'
                + '<div class="form-group">'
                + '<input type="radio" name="period" value="day" checked="checked" class="form-control">'
                + '<label>Day</label>'
                + '</div></div>';
            options_string += '<div class="col-sm-2">'
                + '<div class="form-group">'
                + '<input type="radio" name="period" value="week" class="form-control">'
                + '<label>Week</label>'
                + '</div></div>';
            options_string += '<div class="col-sm-2">'
                + '<div class="form-group">'
                + '<input type="radio" name="period" value="month" class="form-control">'
                + '<label>Month</label>'
                + '</div></div>';

            // // Choose date formatting in the labels
            // options_string += form_div_string_start
            //     + '<label>Date formatting</label>'
            //     + '<input type="text" name="format" value="%Y/%m/%d" class="form-control">'
            //     + '</div></div>';

            $(options_string).appendTo(this.labelOptionsContainer);

            var parent_div = $('<div class="col-sm-12"></div>').appendTo(this.labelOptionsContainer);
            var parent_div = $('<div class="form-group"></div>').appendTo(parent_div);

            // Add daterangepicker
            daterangeField(parent_div);
        },

        showNumericLabelTypes: function(is_sub) {
            var sub = is_sub ? 'sub-' : '';
            var options_string = '<div class="col-sm-12 row" id="' + sub + 'label-type-radio-div">'
                + '<div class="col-sm-4">'
                + '<div class="form-group">'
                + '<input type="radio" name="' + sub + 'labels-type" value="numeric" class="form-control">'
                + '<label>Define labels</label>'
                + '</div></div>';
            options_string += '<div class="col-sm-4">'
                + '<div class="form-group">'
                + '<input type="radio" name="' + sub + 'labels-type" value="number" class="form-control">'
                + '<label>Count</label>'
                + '</div></div>'
                + '</div>';
            $(options_string).appendTo(this.labelOptionsContainer);
        },

        showBooleanLabelOptions: function() {
            var labels_options_string = '<div class="col-sm-12 label-limit-div">'
                + '<div class="row">'
                + '<div class="col-sm-3">'
                + '<div class="form-group">'
                + '<label>Value</label>'
                + '<input type="text" class="limit-label form-control" name="boolean-true" value="true" disabled="disabled">'
                + '</div></div>'
                + '<div class="col-sm-9">'
                + '<div class="form-group">'
                + '<label>Correspondence</label>'
                + '<input type="text" class="limit-label-corres form-control" name="boolean-true-corres">'
                + '</div></div></div>'
                + '<div class="row">'
                + '<div class="col-sm-3">'
                + '<div class="form-group">'
                + '<label>Value</label>'
                + '<input type="text" class="limit-label form-control" name="boolean-false" value="false" disabled="disabled">'
                + '</div></div>'
                + '<div class="col-sm-9">'
                + '<div class="form-group">'
                + '<label>Correspondence</label>'
                + '<input type="text" class="limit-label-corres form-control" name="boolean-false-corres">'
                + '</div></div></div>'
                + '</div>';
            $(labels_options_string).appendTo(this.labelOptionsContainer);
        },

        showTextLabelTypes: function(is_sub) {
            var sub = is_sub ? 'sub-' : '';
            var options_string = '<div class="col-sm-12 row" id="' + sub + 'label-type-radio-div">'
                + '<div class="col-sm-4">'
                + '<div class="form-group">'
                + '<input type="radio" name="' + sub + 'labels-type" value="text-auto" class="form-control">'
                + '<label>Auto text labels</label>'
                + '</div></div>';
            options_string += '<div class="col-sm-4">'
                + '<div class="form-group">'
                + '<input type="radio" name="' + sub + 'labels-type" value="text" class="form-control">'
                + '<label>Define labels</label>'
                + '</div></div>'
                + '</div>';
            $(options_string).appendTo(this.labelOptionsContainer);
        },

        showRefLabelTypes: function(is_sub) {
            var sub = is_sub ? 'sub-' : '';
            var options_string = '<div class="col-sm-12 row" id="' + sub + 'label-type-radio-div">'
                + '<div class="col-sm-4">'
                + '<div class="form-group">'
                + '<input type="radio" name="' + sub + 'labels-type" value="number" class="form-control">'
                + '<label>Count</label>'
                + '</div></div>';
            options_string += '<div class="col-sm-4">'
                + '<div class="form-group">'
                + '<input type="radio" name="' + sub + 'labels-type" value="attribute" class="form-control">'
                + '<label>Sub-attribute</label>'
                + '</div></div>'
                + '</div>';
            $(options_string).appendTo(this.labelOptionsContainer);
        },

        showHasLabelTypes: function(is_sub) {
            var sub = is_sub ? 'sub-' : '';
            var options_string = '<div class="col-sm-12 row" id="' + sub + 'label-type-radio-div">'
                + '<div class="col-sm-4">'
                + '<div class="form-group">'
                + '<input type="radio" name="' + sub + 'labels-type" value="number" class="form-control">'
                + '<label>Count</label>'
                + '</div></div>';
            options_string += '<div class="col-sm-4">'
                + '<div class="form-group">'
                + '<input type="radio" name="' + sub + 'labels-type" value="attribute" class="form-control">'
                + '<label>Sub-attribute</label>'
                + '</div></div>'
                + '</div>';
            $(options_string).appendTo(this.labelOptionsContainer);
        },

        showErrorMessage: function(is_sub, type) {
            var sub = is_sub ? 'sub-' : '';
            var options_string = '<div class="col-sm-12" id="' + sub + 'label-type-radio-div">'
                + '<strong>Type ' + type + ' is not handled</strong>'
                + '</div>';
            $(options_string).appendTo(this.labelOptionsContainer);
        },

        daterangeSelection: function(e) {
            var target = $(e.target);

            // Change date format
            var label_options_container = this.labelOptionsContainer;
            function cb(start, end) {
                label_options_container.find('#daterange-chart span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
            }

            switch(target.val()) {
                case 'Today':
                    cb(moment(), moment());
                    break;

                case 'Yesterday':
                    cb(moment().subtract(1, 'days'), moment().subtract(1, 'days'));
                    break;

                case 'Last 7 Days':
                    cb(moment().subtract(6, 'days'), moment());
                    break;

                case 'This Week':
                    cb(moment().startOf('week'), moment().endOf('week'));
                    break;

                case 'Last Week':
                    cb(moment().subtract(1, 'week').startOf('week'), moment().subtract(1, 'week').endOf('week'));
                    break;

                case 'Last 30 Days':
                    cb(moment().subtract(29, 'days'), moment());
                    break;

                case 'This Month':
                    cb(moment().startOf('month'), moment().endOf('month'));
                    break;

                case 'Last Month':
                    cb(moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month'));
                    break;

                case 'Last 365 Days':
                    cb(moment().subtract(364, 'days'), moment());
                    break;

                case 'This Year':
                    cb(moment().startOf('year'), moment().endOf('year'));
                    break;

                case 'Last Year':
                    cb(moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year'));
                    break;

                case 'Fixed Date Range':
                default:
                    break;

            }
        },

        changeLabelTypeCallback: function(e) {
            var target = $(e.target);

            var value = target.val();
            this.labelOptionsContainer.find('.limit-label').prop("type", value);

            if (target.attr("name") === 'labels-type') {
                this.labelOptionsContainer.find('#sub-select-div').remove();
                this.labelOptionsContainer.children().not('#label-type-radio-div').not('#label').remove();
            }
            else {
                this.labelOptionsContainer.children().not('#label-type-radio-div').not('#sub-label-type-radio-div').not('#label').remove();
            }

            switch(value) {
                case 'attribute':
                    this.showAttributeLabelOptions();
                    break;

                case 'text-auto':
                    this.labelOptionsContainer.children().not('#label-type-radio-div').not('#sub-label-type-radio-div').not('#label').remove();
                    break;

                case 'numeric':
                    this.showNumericLabelOptions();
                    break;

                case 'number':
                    this.showNumberLabelOptions();
                    break;

                case 'text':
                    this.showTextLabelOptions();
                    break;

                default:
                    break;
            }
        },

        showAttributeLabelOptions: function() {
            this.labelOptionsContainer.children().not('#label-type-radio-div').not('#label').remove();
            var select_string = '<div class="col-sm-4" id="sub-select-div">'
                + '<select class="axis-select form-control" name="x-sub">'
                + '<option value="">Choose sub-attribute</option>'
                + '</select></div>';
            $(select_string).appendTo(this.labelOptionsContainer.find('#label-type-radio-div'));
        },

        showNumericLabelOptions: function() {
            var labels_num_div_string = '<div class="col-sm-12" id="labels-num-div" style="margin-bottom:20px;">'
                + '<div class="form-group">'
                + '<label>Number of labels</label>'
                + '<input type="number" name="labels-num" min="1" value="3" class="form-control">'
                + '</div>'
                + '<div class="row">'
                + '<div class="col-sm-6">'
                + '<button class="pull-right btn btn-primary" id="pluck-labels-btn">Generate values with limit: </button>'
                + '</div>'
                + '<div class="col-sm-6">'
                + '<input type="number" name="pluck-num" min="1" value="3" class="form-control pull-right">'
                + '</div></div></div>';
            $(labels_num_div_string).appendTo(this.labelOptionsContainer);
            this.labelOptionsContainer.find('[name="labels-num"]').change();
        },

        showNumberLabelOptions: function() {
            var labels_num_div_string = '<div class="col-sm-12" id="labels-num-div" style="margin-bottom:20px;">'
                + '<div class="form-group">'
                + '<label>Number of labels</label>'
                + '<input type="number" name="labels-num" min="1" value="3" class="form-control">'
                + '</div></div>'
                + '<div class="col-sm-12" id="plus-div">'
                + '<div class="form-group">'
                + '<input type="radio" name="plus" value="true" class="form-control" checked="checked">'
                + '<label>+</label>'
                + '</div>'
                + '<div class="form-group">'
                + '<input type="radio" name="plus" value="false" class="form-control">'
                + '<label>Not +</label>'
                + '</div></div>';
            $(labels_num_div_string).appendTo(this.labelOptionsContainer);
            this.labelOptionsContainer.find('[name="labels-num"]').change();
        },

        showTextLabelOptions: function() {
            var labels_num_div_string = '<div class="col-sm-12" id="labels-num-div" style="margin-bottom:20px;">'
                + '<div class="form-group">'
                + '<label>Number of labels</label>'
                + '<input type="number" name="labels-num" min="1" value="3" class="form-control">'
                + '</div>'
                + '<div class="row">'
                + '<div class="col-sm-6">'
                + '<button class="pull-right btn btn-primary" id="pluck-labels-btn">Generate labels with limit: </button>'
                + '</div>'
                + '<div class="col-sm-6">'
                + '<input type="number" name="pluck-num" min="1" value="30" class="form-control pull-right">'
                + '</div></div></div>';
            $(labels_num_div_string).appendTo(this.labelOptionsContainer);
            this.labelOptionsContainer.find('[name="labels-num"]').change();
        },

        changeLabelsNumCallback: function() {
            var low_limit_div = this.labelOptionsContainer.find('#low-limit-div'), labels_num_div = this.labelOptionsContainer.find('#labels-num-div');

            var number = labels_num_div.find('[name="labels-num"]').val(), previous_number = this.labelOptionsContainer.find('.label-limit-div').length;
            var labels_options_string = '';

            var label_type = this.labelOptionsContainer.find('[name="labels-type"]:checked').val();
            if (label_type === 'attribute') label_type = this.labelOptionsContainer.find('[name="sub-labels-type"]:checked').val();
            var label_base = (label_type === 'number') ? 'Limit ' : 'Label ';

            this.labelOptionsContainer.find('.limit-label').each(function() {
                var id = $(this).attr("name").split('-')[1];
                if (id !== '0') $(this).siblings('label').text(label_base + id);
            });

            // Display low limit for first display
            if (label_type === 'number' && low_limit_div.length === 0) {
                labels_options_string = '<div class="col-sm-6" id="low-limit-div">'
                    + '<div class="form-group">'
                    + '<label>Low limit</label>'
                    + '<input type="number" class="limit-label form-control" name="label-0" min="0" value="0">'
                    + '</div></div>';
                $(labels_options_string).insertAfter(labels_num_div);
                low_limit_div = this.labelOptionsContainer.find('#low-limit-div');
            }

            // On change of labels number, either remove fields if too many, either add fields
            if (number >= previous_number) {
                labels_options_string = '';
                for (var i = previous_number + 1; i <= number; i++) {
                    if (label_type === 'numeric') {
                        labels_options_string += '<div class="col-sm-12 label-limit-div">'
                            + '<div class="row">'
                            + '<div class="col-sm-3">'
                            + '<div class="form-group">'
                            + '<label>Value ' + i +'</label>'
                            + '<input type="number" class="limit-label form-control" name="label-' + i + '">'
                            + '</div></div>'
                            + '<div class="col-sm-9">'
                            + '<div class="form-group">'
                            + '<label>Correspondence ' + i +'</label>'
                            + '<input type="text" class="limit-label-corres form-control" name="label-corres-' + i + '">'
                            + '</div></div></div></div>';
                    }
                    else {
                        labels_options_string += '<div class="col-sm-6 label-limit-div">'
                            + '<div class="form-group">'
                            + '<label>' + label_base + i +'</label>'
                            + '<input type="' + label_type + '" class="limit-label form-control" name="label-' + i + '" min="0">'
                            + '</div></div>';
                    }
                }

                if (previous_number === 0) {
                    if (label_type === 'number') $(labels_options_string).insertAfter(low_limit_div);
                    else $(labels_options_string).insertAfter(labels_num_div);
                }
                else $(labels_options_string).insertAfter(this.labelOptionsContainer.find('.label-limit-div:last'));
            }
            else {
                for (var i = previous_number; i > number; i--) {
                    this.labelOptionsContainer.find('.label-limit-div:last').remove();
                }
            }
        },


        // --------------- Prepare data ---------------
        getChartData: function() {
            var chart_data = {};

            // Axes Data
            this.getAxesData(chart_data);

            // Style Options
            var style_options = chart_data['style'] = {};
            this.getStyleData(style_options);
            this.getColorData(style_options);

            if (this.filter_creator === null)
                this.addDefaultFilters(chart_data);
            else
                chart_data = $.extend(chart_data, {filters: this.filter_creator.data('filterCreator').getFiltersData()});

            return JSON.parse(JSON.stringify(chart_data));
        },

        getAxesData: function(chart_data) {
            // Get select fields values
            var split_x_axis = this.xContainer.find('[name="x-axis"]').val().split('-');
            var x_val = split_x_axis[0], x_type = split_x_axis[1];
            var y_vals = [];
            this.yContainer.find('[name="y-axis"]').each(function() {
                y_vals.push($(this).val());
            });

            // Return if x or y missing
            if (x_val === '' || y_vals.length === 0)
                return alert('Variable missing.');

            // If type is datetime, prepare date_info
            chart_data['x_data'] = {};
            chart_data['x_data']['type'] = x_type;
            var label_type = this.labelOptionsContainer.find('[name="labels-type"]:checked').val();
            if (label_type === 'attribute') {
                var sub_array = this.labelOptionsContainer.find('.axis-select[name="x-sub"]').val().split('-');
                chart_data['x_data']['sub_attribute'] = sub_array[0];
                chart_data['x_data']['sub_attribute_from'] = x_type;
                chart_data['x_data']['type'] = sub_array[1];
                label_type = this.labelOptionsContainer.find('[name="sub-labels-type"]:checked').val();
            }
            chart_data['x_data']['label_type'] = label_type;

            switch(chart_data['x_data']['type']) {
                case 'datetime':
                    var date_info = chart_data['x_data'];
                    var daterange = this.labelOptionsContainer.find('.daterange-value').text().split(' - ');
                    date_info['start'] = daterange[0];
                    date_info['end'] = daterange[1];
                    date_info['date_range_type'] = this.labelOptionsContainer.find('#date-range-select').val();
                    date_info['period'] = this.labelOptionsContainer.find('[name="period"]:checked').val();
                    // date_info['format'] = label_options_div.find('input[name="format"]').val();
                    break;

                case 'has':
                case 'ref':
                case 'text':
                case 'numeric':
                    if (label_type === 'text-auto') break;

                    var labels_num = this.labelOptionsContainer.find('.label-limit-div').length;
                    var labels = chart_data['x_data']['labels'] = [];
                    var labels_corres = chart_data['x_data']['labels-corres'] = [];

                    for (var i = 1; i <= labels_num; i++) {
                        if (label_type === 'number') {
                            var low = parseInt(this.labelOptionsContainer.find('[name="label-' + (i-1) + '"]').val()), high = parseInt(this.labelOptionsContainer.find('[name="label-' + i + '"]').val()) - 1;
                            if (low === high)
                                labels.push(low);
                            else
                                labels.push(low + '-' + high);
                        }
                        else if (label_type === 'numeric') {
                            labels.push(this.labelOptionsContainer.find('[name="label-' + i + '"]').val());
                            labels_corres.push(this.labelOptionsContainer.find('[name="label-corres-' + i + '"]').val());
                        }
                        else
                            labels.push(this.labelOptionsContainer.find('[name="label-' + i + '"]').val());
                    }

                    if (label_type === 'number') {
                        var plus = this.labelOptionsContainer.find('[name="plus"]:checked').val();
                        if (plus === 'true')
                            labels.push(this.labelOptionsContainer.find('[name="label-' + labels_num + '"]').val() + '+');
                    }

                    break;

                case 'boolean':
                    chart_data['x_data']['labels'] = [true, false];

                    var true_corres = this.labelOptionsContainer.find('[name="boolean-true-corres"]').val(),
                        false_corres = this.labelOptionsContainer.find('[name="boolean-false-corres"]').val();
                    chart_data['x_data']['labels-corres'] = [true_corres, false_corres];
                    break;

                default:
                    break;
            }
            chart_data['y_data'] = y_vals;
            chart_data['x_data']['attribute'] = x_val;
            chart_data['x_data']['from_filter'] = (split_x_axis.length === 3);

            // Datasets Labels
            var datasets_labels = [];
            this.yContainer.find('[name="dataset-label"]').each(function() {
                datasets_labels.push($(this).val());
            });
            chart_data['datasets_labels'] = datasets_labels;

            // Options
            chart_data['options'] = null;

            // Types
            var main_type = this.yContainer.find('[name="main-type"]').val(), type = [];
            if (main_type === 'bar' || main_type === 'line') {
                this.yContainer.find('.type-select').each(function() {
                    type.push($(this).val());
                });
            }
            else
                type.push(main_type);
            chart_data['types'] = type;
        },

        getStyleData: function(style_options) {
            // Title
            style_options['title'] = this.styleOptionsContainer.find('[name="title"]').val();

            // Legend
            var legend_options = style_options['legend'] = {};
            legend_options['display'] = this.styleOptionsContainer.find('[name="legend"]').is(':checked');
            legend_options['position'] = this.styleOptionsContainer.find('[name="legend-pos"]').val();

            // Grid
            var grid_options = style_options['grid'] = {};
            grid_options['x'] = this.styleOptionsContainer.find('[name="x-grid-lines"]').is(':checked');
            grid_options['y'] = this.styleOptionsContainer.find('[name="y-grid-lines"]').is(':checked');

            // Y Axis
            var y_axis_options = style_options['y-axis'] = {};
            y_axis_options['min'] = this.styleOptionsContainer.find('[name="y-axis-min"]').val();
            y_axis_options['max'] = this.styleOptionsContainer.find('[name="y-axis-max"]').val();
            y_axis_options['step'] = this.styleOptionsContainer.find('[name="y-axis-step"]').val();

            // Labeling step
            style_options['labeling-step'] = this.styleOptionsContainer.find('[name="labeling-step"]').val();

            // Stacked
            style_options['stacked'] = this.styleOptionsContainer.find('[name="stacked"]').is(':checked');
        },

        getColorData: function(style_options) {
            // Colors
            style_options['colors'] = [];
            this.colorOptionsContainer.find('[name="dataset-color"]').each(function() {
                style_options['colors'].push($(this).val());
            });

            // Area transparency
            style_options['transparencies'] = [];
            this.colorOptionsContainer.find('[name="transparency"]').each(function() {
                style_options['transparencies'].push($(this).val());
            });
        },

        addDefaultFilters: function(chart_data) {
            var filters_data = chart_data['filters'] = {};
            $.each(chart_data['y_data'], function(index, model) {
                filters_data[model] = {num_records: ''};
            });
        },


        // --------------- Build chart from data ---------------
        buildChartFields: function(chart_data) {
            this.buildYAxes(chart_data);
            this.buildXAxis(chart_data['x_data']);
            this.buildLabelOptions(chart_data['x_data'], false);
            this.buildStyleOptions(chart_data['style']);
            this.buildColorOptions(chart_data['style']);
        },

        buildYAxes: function(chart_data) {
            var yContainer = this.yContainer;
            yContainer.find('.remove-var-btn').click();

            $.each(chart_data['y_data'], function(index, value) {
                if (index > 0)
                    yContainer.find('#add-var-btn').click();

                yContainer.find('.var-div:last [name="y-axis"]').focusin().val(value).change();
                yContainer.find('[name="dataset-label"]:last').val(chart_data['datasets_labels'][index]);

            });

            var main_type = chart_data['types'][0];
            yContainer.find('[name="main-type"]').val(main_type).change();
            if (main_type === 'bar' || main_type === 'line') {
                var idx = 1;
                yContainer.find('.type-select').not('[name="main-type"]').each(function() {
                    $(this).val(chart_data['types'][idx++]);
                });
            }
        },

        buildXAxis: function(x_data) {
            var value_string = x_data['attribute'] + '-';
            if ('sub_attribute' in x_data) {
                if (x_data['sub_attribute_from'] === 'has')
                    value_string += 'has';
                else
                    value_string += 'ref';
            }
            else
                value_string += x_data['type'];

            if (x_data['from_filter'] === 'true')
                value_string += '-filter';

            this.xContainer.find('[name="x-axis"]').focusin().val(value_string).change();
        },

        buildLabelOptions: function(x_data, is_sub) {
            if ('sub_attribute' in x_data && !is_sub) {
                if (x_data['sub_attribute_from'] === 'has')
                    this.buildHasLabelOptions(x_data);
                else
                    this.buildRefLabelOptions(x_data);
            }

            switch (x_data['type']) {
                case 'datetime':
                    this.buildDatetimeLabelOptions(x_data);
                    break;

                case 'numeric':
                    this.buildNumericLabelOptions(x_data);
                    break;

                case 'boolean':
                    this.buildBooleanLabelOptions(x_data);
                    break;

                case 'text':
                    this.buildTextLabelOptions(x_data);
                    break;

                case 'has':
                    this.buildHasLabelOptions(x_data);
                    break;

                case 'ref':
                    this.buildRefLabelOptions(x_data);
                    break;

                default:
                    break;

            }
        },

        buildDatetimeLabelOptions: function(x_data) {
            var start = x_data['start'], end = x_data['end'];
            this.labelOptionsContainer.find('.daterange span').html(start + ' - ' + end);
            this.labelOptionsContainer.find('#date-range-select').val(x_data['date_range_type']).change();
            this.labelOptionsContainer.find('[name="period"][value="' + x_data['period'] + '"]').prop('checked', true);
            // $('input[name="format"]').val(x_data['format']);
        },

        buildNumericLabelOptions: function(x_data) {
            var label_options_container = this.labelOptionsContainer;

            var label_type = x_data['label_type'];

            if (label_type === 'number') {
                label_options_container.find('[type="radio"][value="number"]:last').prop('checked', true).change();
                var last_idx = x_data['labels'].length - 1;
                var plus = x_data['labels'][last_idx].split('+');
                var num_labels = last_idx;
                if (plus.length === 1) num_labels++;

                label_options_container.find('[name="labels-num"]').val(num_labels).change();
                $.each(x_data['labels'], function(index, value) {
                    if (index === last_idx) return true;
                    label_options_container.find('[name="label-' + index + '"]:last').val(value.split('-')[0]);
                });
                if (plus.length === 2) {
                    label_options_container.find('[name="label-' + last_idx + '"]:last').val(plus[0]);
                    plus = 'true';
                }
                else {
                    label_options_container.find('[name="label-' + num_labels + '"]:last').val(x_data['labels'][last_idx].split('-')[1]);
                    plus = 'false';
                }
                label_options_container.find('[name="plus"][value="' + plus + '"]').prop('checked', true);
            }
            else {
                $.each(x_data['labels'], function(index, value) {
                    label_options_container.find('[name="label-' + (index+1) + '"]').val(value);
                    label_options_container.find('[name="label-corres-' + (index+1) + '"]').val(x_data['labels-corres'][index]);
                });
            }
        },

        buildBooleanLabelOptions: function(x_data) {
            this.labelOptionsContainer.find('[name="boolean-true-corres"]').val(x_data['labels-corres'][0]);
            this.labelOptionsContainer.find('[name="boolean-false-corres"]').val(x_data['labels-corres'][1]);
        },

        buildTextLabelOptions: function(x_data) {
            var label_options_container = this.labelOptionsContainer;

            var label_type = x_data['label_type'];
            if (label_type === 'text') label_options_container.find('[name="labels-type"][value="text"]').prop('checked', true).change();

            if (label_type !== 'text-auto') {
                label_options_container.find('[name="labels-num"]').val(x_data['labels'].length).change();
                $.each(x_data['labels'], function(index, value) {
                    label_options_container.find('.limit-label[name="label-' + (index+1) + '"]').val(value);
                });
            }
        },

        buildHasLabelOptions: function(x_data) {
            var label_options_container = this.labelOptionsContainer;

            var label_type = ('sub_attribute' in x_data) ? 'attribute' : x_data['label_type'];
            label_options_container.find('[name="labels-type"][value="' + label_type + '"]').prop('checked', true).change();

            if (label_type === 'number') {
                var last_idx = x_data['labels'].length - 1;
                var plus = x_data['labels'][last_idx].split('+');
                var num_labels = last_idx;
                if (plus.length === 1) num_labels++;

                label_options_container.find('[name="labels-num"]').val(num_labels).change();
                $.each(x_data['labels'], function(index, value) {
                    label_options_container.find('.limit-label[name="label-' + index + '"]').val(value.split('-')[0]);
                    if (index === last_idx) return true;
                });
                if (plus.length === 2) {
                    label_options_container.find('.limit-label[name="label-' + last_idx + '"]').val(plus[0]);
                    plus = 'true';
                }
                else {
                    label_options_container.find('.limit-label[name="label-' + num_labels + '"]').val(x_data['labels'][last_idx].split('-')[1]);
                    plus = 'false';
                }
                label_options_container.find('[name="plus"][value="' + plus + '"]').prop('checked', true);
            }
            else {
                var sub_attribute_string = x_data['sub_attribute'] + '-' + x_data['type'];
                label_options_container.find('[name="x-sub"]').focusin().val(sub_attribute_string).change();
                this.buildLabelOptions(x_data, true);
            }
        },

        buildRefLabelOptions: function(x_data) {
            var label_type = ('sub_attribute' in x_data) ? 'attribute' : x_data['label_type'];
            this.labelOptionsContainer.find('[name="labels-type"][value="' + label_type + '"]').prop('checked', true).change();

            if (label_type === 'attribute') {
                var sub_attribute_string = x_data['sub_attribute'] + '-' + x_data['type'];
                this.labelOptionsContainer.find('[name="x-sub"]').focusin().val(sub_attribute_string).change();
                this.buildLabelOptions(x_data, true);
            }
        },

        buildStyleOptions: function(style_options) {
            // Title
            var title = style_options['title'];
            this.styleOptionsContainer.find('[name="title"]').val(title);

            // Legend options
            var legend_options = style_options['legend'];
            this.styleOptionsContainer.find('[name="legend"]').prop('checked', legend_options['display'] === 'true');
            this.styleOptionsContainer.find('[name="legend-pos"]').val(legend_options['position']);

            // Grid checkboxes
            var grid_options = style_options['grid'];
            this.styleOptionsContainer.find('[name="x-grid-lines"]').prop('checked', grid_options['x'] === 'true');
            this.styleOptionsContainer.find('[name="y-grid-lines"]').prop('checked', grid_options['y'] === 'true');

            // Y Axis options
            var y_axis_options = style_options['y-axis'];
            this.styleOptionsContainer.find('[name="y-axis-min"]').val(y_axis_options['min']);
            this.styleOptionsContainer.find('[name="y-axis-max"]').val(y_axis_options['max']);
            this.styleOptionsContainer.find('[name="y-axis-step"]').val(y_axis_options['step']);

            // Labeling step number
            this.styleOptionsContainer.find('[name="labeling-step"]').val(style_options['labeling-step']);

            // Stacked checkbox
            var stacked = style_options['stacked'] === 'true';
            this.styleOptionsContainer.find('[name="stacked"]').prop('checked', stacked);
        },

        buildColorOptions: function(style_options) {
            // Colors
            var colors = style_options['colors'], i = 0;
            this.colorOptionsContainer.find('[name="dataset-color"]').each(function() {
                $(this).val(colors[i]);
                $(this).parent().find('.minicolors-input-swatch .minicolors-swatch-color').css("background-color", colors[i++]);
            });

            // Transparencies
            var transparencies = style_options['transparencies'];
            i = 0;
            this.colorOptionsContainer.find('[name="transparency"]').each(function() {
                $(this).val(transparencies[i++]);
            });
        },


        // --------------- Color callback ---------------
        colorCallback: function() {
            var labels_num_input = this.labelOptionsContainer.find('[name="labels-num"]'),
                main_var_color_divs = this.colorOptionsContainer.find('.color-div[data-id="0"]'),
                x_is_boolean = this.labelOptionsContainer.find('[name="boolean-true"]').length !== 0;

            var main_type = this.yContainer.find('[name="main-type"]').val();

            // No colors if no labels_num (in no boolean case) or if type 1 chart
            if ((labels_num_input.length === 0 && !x_is_boolean) || main_type === 'bar' || main_type === 'line') {
                main_var_color_divs.not('#main-color').remove();
            }
            // Right number of colors for type 2 chart
            else {
                var color_number = x_is_boolean ? 2 : parseInt(labels_num_input.val()),         // 2 colors if x is boolean
                    previous_color_number = parseInt(main_var_color_divs.length);
                var adapt_to_label_type = 0;
                if ((this.labelOptionsContainer.find('[name="labels-type"][value="number"]').is(':checked')
                    || this.labelOptionsContainer.find('[name="sub-labels-type"][value="number"]').is(':checked'))
                    && this.labelOptionsContainer.find('[name="plus"][value="true"]').is(':checked')) {
                    adapt_to_label_type = 1;
                }

                if (color_number >= previous_color_number) {
                    for (var i = previous_color_number; i < color_number + adapt_to_label_type; i++) {
                        this.addColorToCreator(0, i + 1);
                    }
                }
                else {
                    for (var i = previous_color_number - adapt_to_label_type; i > color_number; i--) {
                        this.colorOptionsContainer.find('.color-div[data-id="0"]:last').remove();
                    }
                }
            }
        }

    };

    $.fn.chartCreator = function(options, callback) {
        this.each(function(i, _element) {
            var el = $(_element);
            if (el.data('chartCreator'))
                el.data('chartCreator').remove();
            el.data('chartCreator', new ChartCreator(el, options, callback));
        });
        return this;
    };

    // Creates a daterange field for datetime label options
    function daterangeField(parent_div) {
        // Append (empty) daterangepicker
        var daterange_input_string = '<label>In range</label>'
            + '<div id="daterange-chart" class="daterange" style="background: #fff; cursor: pointer; padding: 5px 10px; border: 1px solid #ccc; width: 100%">'
            + '<i class="glyphicon glyphicon-calendar fa fa-calendar"></i>&nbsp;'
            + '<span class="daterange-value"></span>'
            + '<b class="caret"></b>'
            + '</div>';
        var daterange_input = $(daterange_input_string).appendTo(parent_div);

        // Customize daterangepicker
        $(function() {
            // Default start, end
            var start = moment().subtract(29, 'days');
            var end = moment();

            // Change date format
            function cb(start, end) {
                parent_div.find('#daterange-chart span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
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
    }

    return ChartCreator;
});