/*!
 * Dashboard Creator v1.0
 * 2017 Elie Oriol
 */

(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define([ 'jquery' ], factory);
    }
    else if (typeof exports === 'object') { // Node/CommonJS
        module.exports = factory(require('jquery'));
    }
    else {
        factory(jQuery);
    }
})(function($) {
    var DashboardCreator = function(element, options, callback) {
        this.parentEl = $(element);

        // Objects data format:
        // 'object.code': {
        //      'info': object.info,
        //      'name': object.name,
        //      'objects': [model_objects]
        // }

        // Model object format:
        // {
        //      'id': object.id,
        //      'name': object.name
        // }

        if (typeof options !== 'object' || options === null)
            options = {};

        this.objects_data = typeof options.objects_data === 'object' ? options.objects_data : {};

        this.callback = (typeof callback === 'function') ? callback : function() { };

        if (typeof options.template !== 'string' && !(options.template instanceof $)) {
            options.template = '<div class="row">' +
                '<div class="col-md-12 px-2" style="background-color: #eee; border-radius: 10px; padding: 20px 10px;">' +
                '<h3>Dashboard Preview</h3>' +
                '<div class="row" id="dashboard-preview" style="margin: 30px; padding: 20px; border: 1px dashed black; border-radius: 10px;">' +
                '</div>' +
                '</div>' +
                '<div class="col-md-12 px-2">' +
                '<div class="row" id="sections-container">' +
                '<div class="col-sm-12" style="margin-top:50px;" id="add-section-btn-container">' +
                '<button id="add-section-btn" class="btn btn-primary">+</button>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
        }

        this.container = $(options.template).appendTo(this.parentEl);
        this.sections_container = this.container.find('div#sections-container');
        this.dashboard_preview = this.container.find('div#dashboard-preview');

        this.sections_container
            .on('click', '#add-section-btn', $.proxy(this.addSection, this))
            .on('click', '.remove-section-btn', $.proxy(this.removeSection, this))
            .on('change', 'input[name="section-name"]', $.proxy(this.changeSectionName, this))
            .on('click', '.add-object-btn', $.proxy(this.addObject, this))
            .on('click', '.remove-object-btn', $.proxy(this.removeObject, this))
            .on('change', 'select[name="object_type"]', $.proxy(this.displayObjectSelect, this))
            .on('blur', 'select[name="object_select"]', $.proxy(this.selectObjectResponse, this))
            .on('change', 'select[name="object_select"]', $.proxy(this.selectObjectResponse, this));

        this.dashboard_preview
            .on('change', 'input[name="section-size"]', $.proxy(this.changeSectionSize, this))
            .on('change', 'input[name="section-offset"]', $.proxy(this.changeSectionOffset, this))
            .on('change', 'input[name="object-size"]', $.proxy(this.changeObjectSize, this))
            .on('change', 'input[name="object-offset"]', $.proxy(this.changeObjectOffset, this))
            // Event 'build' to avoid wrong dashboard display
            .on('build', 'input[name="section-size"]', $.proxy(this.changeSectionSize, this))
            .on('build', 'input[name="section-offset"]', $.proxy(this.changeSectionOffset, this))
            .on('build', 'input[name="object-size"]', $.proxy(this.changeObjectSize, this))
            .on('build', 'input[name="object-offset"]', $.proxy(this.changeObjectOffset, this));
    };

    DashboardCreator.prototype = {

        constructor: DashboardCreator,

        // --------------- Sections handling ---------------
        // Add section
        addSection: function() {
            var last_section = this.sections_container.find('.section:last');
            var section_id = last_section.length === 0 ? 1 : parseInt(last_section.attr('data-section-id')) + 1;

            this.addCreatorSection(section_id);
            this.addPreviewSection(section_id);
        },

        // Add section to creator
        addCreatorSection: function(section_id) {
            var section_string = '<div class="col-sm-12 section" data-section-id="' + section_id + '" style="margin-top: 50px;">'
                + '<div class="row">'
                + '<div class="col-sm-1">'
                + '<button type="button" class="close remove-section-btn" aria-label="Close">'
                + '<span aria-hidden="true">×</span>'
                + '</button>'
                + '</div>'
                + '<div class="col-sm-2">'
                + '<h5 class="section-name">Section ' + section_id + '</h5>'
                + '</div>'
                + '<div class="form-group col-sm-9">'
                + '<input type="text" name="section-name" value="Section ' + section_id + '" class="form-control">'
                + '</div>'
                + '<div class="col-sm-11 offset-sm-1">'
                + '<ul class="section-objects-list"></ul>'
                + '<button class="btn-sm btn-primary add-object-btn">+</button>'
                + '</div></div></div>';

            $(section_string).appendTo(this.sections_container);
        },

        // Add section to preview
        addPreviewSection: function(section_id) {
            var preview_section_string = '<div class="col-sm-12 preview-section" data-section-id="' + section_id + '" style="padding: 20px; overflow: auto;">'
                + '<div style="padding: 15px 30px; background-color: #2d8ac7; border: 1px solid #0e6498; border-radius: 5px;">'
                + '<div class="row" style="margin-bottom: 20px;">'
                + '<div class="col-sm-6">'
                + '<h5 class="section-name">Section ' + section_id + '</h5>'
                + '</div>'
                + '<div class="col-sm-3">'
                + '<input type="number" name="section-size" min="1" max="12" step="1" value="12" class="form-control">'
                + '</div>'
                + '<div class="col-sm-3">'
                + '<input type="number" name="section-offset" min="0" max="11" step="1" value="0" class="form-control">'
                + '</div></div>'
                + '<div class="row preview-objects-container"></div>'
                + '</div></div>';

            $(preview_section_string).appendTo(this.dashboard_preview);
        },

        removeSection: function(e) {
            var target = $(e.target);

            var section_id = target.closest('.section').attr("data-section-id");
            this.removeCreatorSection(section_id);
            this.removePreviewSection(section_id);
        },

        // Remove section from creator
        removeCreatorSection: function(section_id) {
            this.sections_container.find('.section[data-section-id="' + section_id + '"]').remove();
        },

        // Remove section from preview
        removePreviewSection: function(section_id) {
            this.dashboard_preview.find('.preview-section[data-section-id="' + section_id + '"]').remove();
        },

        changeSectionName: function(e) {
            var target = $(e.target);

            var section_id = target.closest('.section').attr('data-section-id');
            var preview_section = this.dashboard_preview.find('.preview-section[data-section-id="' + section_id + '"]');
            var section_name = target.val();
            preview_section.find('.section-name').text(section_name);
        },


        // --------------- Objects handling ---------------
        // Add an object to section
        addObject: function(e) {
            var target = $(e.target);

            var objects_list = target.siblings('.section-objects-list');
            var section_id = target.closest('.section').attr("data-section-id");

            var last_object = objects_list.find('.object:last');
            var new_object_id = last_object.length === 0 ? 1 : parseInt(last_object.attr("data-id")) + 1;

            var object_string = '<li class="object" data-section-id="' + section_id + '" data-id="' + new_object_id + '">'
                + '<div class="row">'
                + '<div class="col-sm-1">'
                + '<button type="button" class="close remove-object-btn" aria-label="Close">'
                + '<span aria-hidden="true">×</span>'
                + '</button>'
                + '</div>'
                + '<div class="form-group col-sm-5">'
                + '<select name="object_type" class="form-control"></select>'
                + '</div>'
                + '<div class="form-group col-sm-5 offset-sm-1 select-object">'
                + '</div>'
                + '</div></li>';

            var li_object = $(object_string).appendTo(objects_list);

            var options_string = '<option value="">Choose object type</option>';
            $.each(this.objects_data, function(type, data) {
                var name = data['name'];
                options_string += '<option value="' + type + '">' + name + '</option>';
            });

            $(options_string).appendTo(li_object.find('[name="object_type"]'));
        },

        // Remove an object from section
        removeObject: function(e) {
            var target = $(e.target);

            // Remove from creator and preview
            var object_div = target.closest('.object');
            var section_id = object_div.attr("data-section-id"), object_id = object_div.attr("data-id");
            var preview_object = this.dashboard_preview.find('.preview-object[data-section-id="' + section_id + '"][data-id="' + object_id + '"]');
            object_div.remove();
            preview_object.remove();
        },

        // Display select according to object type selected
        displayObjectSelect: function(e) {
            var target = $(e.target);

            // Remove select if already one
            var select_object_div = target.closest('.object').find('.select-object');
            select_object_div.children().remove();

            // Return if type is empty (value of select prompt)
            var object_type = target.val();
            if (object_type === '') return;

            // Retrieve object type info
            var object_info = this.objects_data[object_type]['info'];

            // Add select if associated to model
            if (object_info['model_name'] !== '') {
                var select_string = '<select name="object_select" class="form-control">'
                    + '<option value="">Choose a ' + object_type + '</option>'
                    + '</select>';

                var select = $(select_string).appendTo(select_object_div);

                // Add options to select
                var objects = this.objects_data[object_type]['objects'];
                var options_string = '';
                for (var i = 0; i < objects.length; i++) {
                    var name = objects[i]['name'], id = objects[i]['id'];
                    options_string += '<option value="' + id + '">' + name + '</option>';
                }

                $(options_string).appendTo(select);
            }
        },

        // Respond to object select change
        selectObjectResponse: function(e) {
            var target = $(e.target);

            var option_value = target.val();

            var object_div = target.closest('.object');
            var id = object_div.attr("data-id"), section_id = object_div.attr("data-section-id");

            if (option_value === '') return this.removeObjectPreview(id, section_id);

            this.addObjectPreview(id, section_id);
        },

        // Add object to preview
        addObjectPreview: function(id, section_id) {
            var object_div = this.sections_container.find('[data-id="' + id + '"][data-section-id="' + section_id + '"]');
            var object_type = object_div.find('[name="object_type"] option:selected').text();
            var object_name = object_div.find('[name="object_select"] option:selected').text();

            var object_preview_string = '<div class="col-sm-6 preview-object" data-section-id="' + section_id + '" data-id="' + id + '" style="padding: 20px;">'
                + '<div class="row" style="height: 100px; padding: 10px; background-color: #00bf8f; border: 1px solid #00a67c; border-radius: 5px;">'
                + '<div class="col-sm-12" style="margin-bottom: 10px;">'
                + '<strong>' + object_type + ' ' + object_name + '</strong>'
                + '</div>'
                + '<div class="col-sm-6">'
                + '<input type="number" name="object-size" min="1" max="12" step="1" value="6" class="form-control">'
                + '</div>'
                + '<div class="col-sm-6">'
                + '<input type="number" name="object-offset" min="0" max="11" step="1" value="0" class="form-control">'
                + '</div></div></div>';

            var preview_objects_container = this.dashboard_preview.find('.preview-section[data-section-id="' + section_id + '"] .preview-objects-container');
            var preview_section_objects = preview_objects_container.find('.preview-object');

            if (preview_section_objects.length === 0) return $(object_preview_string).appendTo(preview_objects_container);
            if (preview_objects_container.find('.preview-object[data-id="' + id +'"]').length !== 0) return;

            var to_append = true;
            preview_section_objects.each(function() {
                if (parseInt($(this).attr("data-id")) > id) {
                    to_append = false;
                    return $(object_preview_string).insertBefore($(this));
                }
            });
            if (to_append) $(object_preview_string).appendTo(preview_objects_container);
        },

        // Remove object from preview
        removeObjectPreview: function(id, section_id) {
            this.dashboard_preview.find('[data-id="' + id + '"][data-section-id="' + section_id + '"]').remove();
        },

        // Change section preview on size change
        changeSectionSize: function(e) {
            var target = $(e.target);

            var size = target.val();
            var preview_section = target.closest('.preview-section');

            var new_class = 'col-sm-' + size, old_class = 'col-sm-12';

            $.each(preview_section.attr("class").split(' '), function(index, c) {
                if (c.indexOf('col-sm-') !== -1)
                    return old_class = c;
            });

            if (new_class !== old_class) {
                var duration = e.type === 'change' ? 400 : 0;
                preview_section.switchClass(old_class, new_class, duration);
            }
        },

        // Change section preview on offset change
        changeSectionOffset: function(e) {
            var target = $(e.target);

            var offset = target.val();
            var preview_section = target.closest('.preview-section');

            var new_class = 'offset-sm-' + offset, old_class = '';

            $.each(preview_section.attr("class").split(' '), function(index, c) {
                if (c.indexOf('offset-sm-') !== -1)
                    return old_class = c;
            });

            if (new_class !== old_class) {
                var duration = e.type === 'change' ? 400 : 0;
                preview_section.switchClass(old_class, new_class, duration);
            }
        },

        // Change object preview on size change
        changeObjectSize: function(e) {
            var target = $(e.target);

            var size = target.val();
            var preview_object = target.closest('.preview-object');

            var new_class = 'col-sm-' + size, old_class = 'col-sm-6';

            $.each(preview_object.attr("class").split(' '), function(index, c) {
                if (c.indexOf('col-sm-') !== -1)
                    return old_class = c;
            });

            if (new_class !== old_class) {
                var duration = e.type === 'change' ? 400 : 0;
                preview_object.switchClass(old_class, new_class, duration);
            }
        },

        // Change object preview on offset change
        changeObjectOffset: function(e) {
            var target = $(e.target);

            var offset = target.val();
            var preview_object = target.closest('.preview-object');

            var new_class = 'offset-sm-' + offset, old_class = '';

            $.each(preview_object.attr("class").split(' '), function(index, c) {
                if (c.indexOf('offset-sm-') !== -1)
                    return old_class = c;
            });

            if (new_class !== old_class) {
                var duration = e.type === 'change' ? 400 : 0;
                preview_object.switchClass(old_class, new_class, duration);
            }
        },


        // --------------- Prepare data ---------------
        // Get the dashboard data
        getDashboardData: function() {
            var dashboard_data = [];
            this.getSectionsData(dashboard_data);

            return JSON.parse(JSON.stringify(dashboard_data));
        },

        // Get sections data
        getSectionsData: function(dashboard_data) {
            var creator = this;
            creator.sections_container.find('.section').each(function() {
                var section_data = dashboard_data[dashboard_data.push({}) - 1];
                creator.getSectionData(section_data, $(this));
            });
        },

        // Get a section data
        getSectionData: function(section_data, section_div) {
            // Get size & offset in preview
            var section_id = section_div.attr("data-section-id");
            var preview_section = this.dashboard_preview.find('.preview-section[data-section-id="' + section_id + '"]');
            var section_size = preview_section.find('[name="section-size"]').val();
            var section_offset = preview_section.find('[name="section-offset"]').val();

            // Get name
            var section_name = section_div.find('[name="section-name"]').val();

            // Fill section data in hash

            section_data['name'] = section_name;
            section_data['size'] = section_size;
            section_data['offset'] = section_offset;
            section_data['objects'] = [];

            // Add objects
            var objects_list = section_div.find('.section-objects-list');
            this.getObjectsData(section_data['objects'], objects_list);
        },

        // Get objects data of a section
        getObjectsData: function(objects_data, objects_list) {
            var creator = this;
            objects_list.find('.object').each(function() {
                var object_data = objects_data[objects_data.push({}) - 1];
                creator.getObjectData(object_data, $(this));
            });
        },

        // Get an object data
        getObjectData: function(object_data, object_div) {
            // Get object type and return if empty (don't add to hash)
            var type = object_div.find('[name="object_type"]').val();
            if (type === '') return true;

            // Get size & offset in preview
            var object_id = object_div.attr("data-id"), section_id = object_div.attr("data-section-id");
            var preview_object = this.dashboard_preview.find('.preview-object[data-section-id="' + section_id + '"][data-id="' + object_id + '"]');
            var object_size = preview_object.find('[name="object-size"]').val();
            var object_offset = preview_object.find('[name="object-offset"]').val();

            // Fill object data in hash

            object_data['type'] = type;
            object_data['size'] = object_size;
            object_data['offset'] = object_offset;

            var object_select = object_div.find('[name="object_select"]');
            if (object_select.length !== 0) object_data['id'] = object_select.val();
        },


        // --------------- Build dashboard from data ---------------
        // Build dashboard from data
        buildDashboard: function(dashboard_data) {
            this.sections_container.children().not('#add-section-btn-container').remove();
            this.dashboard_preview.children().remove();

            this.buildSections(dashboard_data);
        },

        // Build sections from data
        buildSections: function(dashboard_data) {
            var creator = this;
            // For each section data in dashboard data
            $.each(dashboard_data, function(index, section_data) {
                creator.buildSection(section_data);
            });
        },

        // Build a section from data
        buildSection: function(section_data) {
            // Add new section
            this.sections_container.find('#add-section-btn').click();

            // Fill section name, size & offset
            this.sections_container.find('[name="section-name"]:last').val(section_data['name']);
            this.dashboard_preview.find('[name="section-size"]:last').val(section_data['size']).trigger('build');
            this.dashboard_preview.find('[name="section-offset"]:last').val(section_data['offset']).trigger('build');

            // Rebuild objects of section
            this.buildObjects(section_data['objects']);
        },

        // Build objects of a section from data
        buildObjects: function(objects_data) {
            var creator = this;
            // For each object data in objects array
            $.each(objects_data, function(index, object_data) {
                creator.buildObject(object_data);
            });
        },

        // Build an object from data
        buildObject: function(object_data) {
            // Add new object to section
            this.sections_container.find('.add-object-btn:last').click();

            // Fill object type
            var type = object_data['type'];
            this.sections_container.find('[name="object_type"]:last').val(type).change();

            // Select object
            var object_select = this.sections_container.find('[name="object_select"]:last');
            if (object_select.length !== 0) object_select.val(object_data['id']).change();

            // Fill object size & offset
            this.dashboard_preview.find('[name="object-size"]:last').val(object_data['size']).trigger('build');
            this.dashboard_preview.find('[name="object-offset"]:last').val(object_data['offset']).trigger('build');
        }

    };

    $.fn.dashboardCreator = function(options, callback) {
        this.each(function(i, _element) {
            var el = $(_element);
            if (el.data('dashboardCreator'))
                el.data('dashboardCreator').remove();
            el.data('dashboardCreator', new DashboardCreator(el, options, callback));
        });
        return this;
    };

    return DashboardCreator;
});

