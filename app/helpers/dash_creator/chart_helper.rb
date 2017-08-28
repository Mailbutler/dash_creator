module DashCreator
  module ChartHelper
    def plot_chart(id, type, plot_data, options = {})
      default_options = {
          tooltips: {
              mode: 'nearest',
              intersect: false
          },
          responsive: true
      }
      options = options.merge(default_options)
      render 'dash_creator/chart/plot_chart', {id: id, type: type, data: plot_data, options: options}
    end

    def create_update_button(id, type, text)
      button_tag text, id: "btn-#{type}-#{id}"
    end

    def update_chart_script(id, type, action_path, action_params = {})
      render 'dash_creator/chart/update_chart', {id: id, type: type, action_path: action_path, action_params: action_params}
    end

    # Data formatting (hash)
    # :labels is array of labels
    # :datasets_labels is array of datasets labels
    # :datasets is array of arrays containing the datasets data
    # for a mixed chart, :types is array of datasets types
    # :style contains chart styling
    def plot_type_1_chart(id, type, data, options = {})
      begin
        raise ArgumentError, 'datasets_key_missing' unless data.key?('datasets')
        raise ArgumentError, 'labels_key_missing' unless data.key?('labels')
        raise ArgumentError, 'types_key_missing' if (type == 'mixed' && !data.key?('types'))

        plot_data = type_1_data_to_plot(data)
      rescue Exception => e
        return render html: create_plot_error_message(id, type, e.message).to_s
      end
      plot_data_with_options = type_1_add_style(plot_data, data['style'])
      plot_data_with_options[:options] = plot_data_with_options[:options].merge(options)

      plot_chart(id, type, plot_data_with_options[:plot_data], plot_data_with_options[:options])
    end

    def type_1_data_to_plot(data)
      datasets = []
      0.upto(data['datasets'].length-1) do |i|
        set = {data: data['datasets'][i]}
        unless data['labels'][i].nil?
          set[:label] = data['datasets_labels'][i] unless data['datasets_labels'].nil?
        end
        set[:type] = data['types'][i]
        datasets.push(set)
      end

      {labels: data['labels'], datasets: datasets}
    end

    def type_1_add_style(plot_data, style_options)
      colors = style_options['colors'].nil? ? nil : set_transparency(style_options['colors'], style_options['transparencies'])

      0.upto(plot_data[:datasets].length-1) do |i|
        set = plot_data[:datasets][i]
        set[:backgroundColor] = colors[i] unless colors.nil? || colors[i].nil?
        set[:borderColor] = style_options['colors'][i] unless style_options['colors'].nil? || style_options['colors'][i].nil?
      end

      # Initialize options
      options = {}
      scales = options['scales'] = {}
      scales['xAxes'] = [{}]
      scales['yAxes'] = [{}]
      scales['xAxes'][0]['gridLines'] = {}
      scales['xAxes'][0]['ticks'] = {}
      scales['yAxes'][0]['gridLines'] = {}
      scales['yAxes'][0]['ticks'] = {}

      # Grid options
      grid_options = style_options['grid']
      scales['xAxes'][0]['gridLines']['display'] = false if grid_options['x'] == 'false'
      scales['yAxes'][0]['gridLines']['display'] = false if grid_options['y'] == 'false'

      # Y Axis options
      y_axis_options = style_options['y-axis']
      scales['yAxes'][0]['ticks']['min'] = y_axis_options['min'].to_i if y_axis_options['min'] != ''
      scales['yAxes'][0]['ticks']['max'] = y_axis_options['max'].to_i if y_axis_options['max'] != ''
      scales['yAxes'][0]['ticks']['stepSize'] = y_axis_options['step'].to_i if y_axis_options['step'] != ''

      # Stacked
      if style_options['stacked'] == 'true'
        scales['xAxes'][0]['stacked'] = true
        scales['yAxes'][0]['stacked'] = true
      end

      # Labeling step
      scales['xAxes'][0]['ticks']['callback'] = style_options['labeling-step'] if style_options['labeling-step'] != ''

      # Legend
      options['legend'] = {display: false} if style_options['legend'] == 'false'

      # Title
      options['title'] = {display: true, text: style_options['title']} if style_options['title'] != ''

      {plot_data: plot_data, options: options}
    end



    # Data formatting (hash)
    # :labels is array of labels
    # :datasets is array of arrays containing the datasets data
    # :style contains chart styling
    def plot_type_2_chart(id, type, data, options = {})
      begin
        raise ArgumentError, 'datasets_key_missing' unless data.key?('datasets')
        raise ArgumentError, 'labels_key_missing' unless data.key?('labels')

        plot_data = type_2_data_to_plot(data)
      rescue Exception => e
        return render html: create_plot_error_message(id, type, e.message).to_s
      end
      plot_data_with_options = type_2_add_style(plot_data, data['style'])
      plot_data_with_options = plot_data_with_options.merge(options)

      plot_chart(id, type, plot_data_with_options[:plot_data], plot_data_with_options[:options])
    end

    def type_2_data_to_plot(data)
      datasets = []
      0.upto(data['datasets'].length-1) do |i|
        set = {
            data: data['datasets'][i]
        }
        datasets.push(set)
      end

      {labels: data['labels'], datasets: datasets}
    end

    def type_2_add_style(plot_data, style_options)
      0.upto(plot_data[:datasets].length-1) do |i|
        set = plot_data[:datasets][i]
        set[:backgroundColor] = set_transparency(style_options['colors'], style_options['transparencies']) unless style_options['colors'].nil?
      end

      options = {}
      options['legend'] = {display: false} if style_options['legend'] == 'false'
      options['title'] = {display: true, text: style_options['title']} if style_options['title'] != ''

      {plot_data: plot_data, options: options}
    end


    # Type 1 charts & mixed bar/line
    def plot_line_chart(id, data, options = {})
      plot_type_1_chart(id, 'line', data, options)
    end

    def plot_bar_chart(id, data, options = {})
      plot_type_1_chart(id, 'bar', data, options)
    end

    def plot_mixed_chart(id, data, options = {})
      plot_type_1_chart(id, 'mixed', data, options)
    end


    # Type 2 charts
    def plot_pie_chart(id, data, options = {})
      plot_type_2_chart(id, 'pie', data, options)
    end

    def plot_doughnut_chart(id, data, options = {})
      plot_type_2_chart(id, 'doughnut', data, options)
    end

    def plot_polar_chart(id, data, options = {})
      plot_type_2_chart(id, 'polarArea', data, options)
    end

    def plot_radar_chart(id, data, options = {})
      plot_type_2_chart(id, 'radar', data, options)
    end


    # From rgb to rgba with given colors and transparencies
    def set_transparency(colors, transparencies)
      colors_with_transparency = []
      0.upto(colors.length - 1).each { |i| colors_with_transparency.push('rgba' + colors[i][3..-2] + ', ' + (1-(transparencies[i].to_f/100)).to_s + ')') }
      colors_with_transparency
    end

    # Returns plot failing error message
    def create_plot_error_message(id, type, error_key)
      str = error_key + " for chart-#{type}-#{id}"
      str
    end


    # Data processing for charts
    # Handle differently regarding x_data type
    def chart_processing(data)
      ActiveRecord::Base.connection.execute("SET temp_buffers = '4GB';")
      case data['x_data']['type']
        when 'datetime'
          hash = date_chart_processing(data)

        when 'numeric'
          hash = numeric_chart_processing(data)

        when 'boolean'
          hash = boolean_chart_processing(data)

        when 'text'
          hash = text_chart_processing(data)

        when 'has'
          hash = has_model_chart_processing(data)

        when 'ref'
          hash = ref_model_chart_processing(data)

        else
          hash = {}
      end
      ActiveRecord::Base.connection.execute("SET temp_buffers = '8MB';")
      hash = hash.merge({
                            datasets_labels: data['datasets_labels'],
                            types: data['types'],
                            style: data['style']
                        })
      hash
    end

    def get_start_and_end_dates(date_info)
      date_range_type = date_info['date_range_type']

      case date_range_type
        when 'Today'
          start_date = DateTime.now.beginning_of_day
          end_date = DateTime.now.beginning_of_day + 1.days

        when 'Yesterday'
          start_date = DateTime.now.beginning_of_day - 1.days
          end_date = DateTime.now.beginning_of_day

        when 'Last 7 Days'
          start_date = DateTime.now.beginning_of_day - 6.days
          end_date = DateTime.now.beginning_of_day + 1.days

        when 'This Week'
          start_date = DateTime.now.beginning_of_week
          end_date = DateTime.now.beginning_of_week + 7.days

        when 'Last Week'
          start_date = DateTime.now.beginning_of_week - 7.days
          end_date = DateTime.now.beginning_of_week

        when 'Last 30 Days'
          start_date = DateTime.now.beginning_of_day - 29.days
          end_date = DateTime.now.beginning_of_day + 1.days

        when 'This Month'
          start_date = DateTime.now.beginning_of_month
          end_date = DateTime.now.beginning_of_month + 30.days

        when 'Last Month'
          start_date = DateTime.now.beginning_of_month - 30.days
          end_date = DateTime.now.beginning_of_month

        when 'Last 365 Days'
          start_date = DateTime.now.beginning_of_day - 364.days
          end_date = DateTime.now.beginning_of_day + 1.days

        when 'This Year'
          start_date = DateTime.now.beginning_of_year
          end_date = DateTime.now.beginning_of_year + 365.days

        when 'Last Year'
          start_date = DateTime.now.beginning_of_year - 365.days
          end_date = DateTime.now.beginning_of_year

        else
          start_date = DateTime.strptime(date_info['start'], '%b %d, %Y').beginning_of_day
          end_date = DateTime.strptime(date_info['end'], '%b %d, %Y').beginning_of_day + 1.days
      end

      [start_date, end_date]
    end

    # Process chart data for a x timeline
    def date_chart_processing(data)
      date_info = data['x_data']
      y_data = data['y_data']

      sub_attribute = date_info['sub_attribute']
      unless sub_attribute.nil?
        return sub_has_date_chart_processing(data) if date_info['sub_attribute_from'] == 'has'
        return sub_ref_date_chart_processing(data)
      end

      # Gather all info
      attribute = date_info['attribute']
      format = date_info.key?('format') ? date_info['format'] : '%d.%m.%Y'
      end_date = get_start_and_end_dates(date_info)[1]
      labels = get_date_labels(date_info)

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}
      0.upto(labels.length-1).each do |i|
        date = labels[i]
        next_date = i == (labels.length - 1) ? end_date : labels[i+1]
        0.upto(y_data.length-1).each do |k|
          count = y_data[k].where("#{attribute}": date..next_date).count
          datasets[k].push(count)
        end
      end

      labels = labels.map{ |d| d.strftime(format) }

      {labels: labels, datasets: datasets}
    end

    def sub_has_date_chart_processing(data)
      date_info = data['x_data']
      y_data = data['y_data']

      # Gather all info
      has_models = date_info['attribute'].pluralize
      model_string = y_data.first.first.class.name.underscore
      sub_attribute = date_info['sub_attribute']

      format = date_info.key?('format') ? date_info['format'] : '%d.%m.%Y'
      end_date = get_start_and_end_dates(date_info)[1]
      labels = get_date_labels(date_info)

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}
      0.upto(labels.length-1).each do |i|
        date = labels[i]
        next_date = i == (labels.length - 1) ? end_date : labels[i+1]
        0.upto(y_data.length-1).each do |k|
          data = y_data[k].joins("LEFT JOIN #{has_models} ON #{has_models}.#{model_string}_id = #{model_string.pluralize}.id")
                     .group("#{model_string.pluralize}.id")
                     .having("#{has_models}.#{sub_attribute}": date..next_date)

          total_count = 0
          data.count.each { |key, count| total_count += count }
          datasets[k].push(total_count)
        end
      end

      labels = labels.map { |d| d.strftime(format) }

      {labels: labels, datasets: datasets}
    end

    def sub_ref_date_chart_processing(data)
      date_info = data['x_data']
      y_data = data['y_data']

      # Gather all info
      ref_model = date_info['attribute'][0..-4]
      sub_attribute = date_info['sub_attribute']

      format = date_info.key?('format') ? date_info['format'] : '%d.%m.%Y'
      end_date = get_start_and_end_dates(date_info)[1]
      labels = get_date_labels(date_info)

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}
      0.upto(labels.length-1).each do |i|
        date = labels[i]
        next_date = i == (labels.length - 1) ? end_date : labels[i+1]
        0.upto(y_data.length-1).each do |k|
          count = y_data[k].joins(:"#{ref_model}")
                      .where("#{ref_model.pluralize}.#{sub_attribute}": date..next_date)
                      .count

          datasets[k].push(count)
        end
      end

      labels = labels.map { |d| d.strftime(format) }

      {labels: labels, datasets: datasets}
    end

    def numeric_chart_processing(data)
      x_data = data['x_data']
      y_data = data['y_data']

      attribute = x_data['attribute']

      sub_attribute = x_data['sub_attribute']
      unless sub_attribute.nil?
        return sub_has_numeric_chart_processing(data) if x_data['sub_attribute_from'] == 'has'
        return sub_ref_numeric_chart_processing(data)
      end

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}
      labels = x_data['labels-corres'].empty? ? x_data['labels'] : x_data['labels-corres']

      x_data['labels'].each do |l|
        0.upto(y_data.length-1).each do |i|
          split = l.split('-')
          low = l[-1] == '+' ? l[0..-2] : split[0]
          high = split.length == 2 ? split[1] : low
          data = y_data[i].where("#{attribute}" + ' >= ?', low)
          data = data.where("#{attribute}" + ' <= ?', high) unless l[-1] == '+'

          datasets[i].push(data.count)
        end
      end

      {labels: labels, datasets: datasets}
    end

    def sub_has_numeric_chart_processing(data)
      x_data = data['x_data']
      y_data = data['y_data']

      has_models = x_data['attribute'].pluralize
      model_string = y_data.first.first.class.name.underscore
      sub_attribute = x_data['sub_attribute']

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}
      labels = x_data['labels-corres'].empty? ? x_data['labels'] : x_data['labels-corres']

      x_data['labels'].each do |l|
        0.upto(y_data.length-1).each do |i|
          split = l.split('-')
          low = l[-1] == '+' ? l[0..-2] : split[0]
          high = split.length == 2 ? split[1] : low

          if l[-1] == '+'
            data = y_data[i].joins("LEFT JOIN #{has_models} ON #{has_models}.#{model_string}_id = #{model_string.pluralize}.id")
                       .group("#{model_string.pluralize}.id, #{has_models}.#{sub_attribute}")
                       .having("#{has_models}.#{sub_attribute} >= ?", low)
          else
            data = y_data[i].joins("LEFT JOIN #{has_models} ON #{has_models}.#{model_string}_id = #{model_string.pluralize}.id")
                       .group("#{model_string.pluralize}.id, #{has_models}.#{sub_attribute}")
                       .having("#{has_models}.#{sub_attribute}": low..high)
          end

          sum = 0
          data.count.each { |key, count| sum += count }
          datasets[i].push(sum)
        end
      end

      {labels: labels, datasets: datasets}
    end

    def sub_ref_numeric_chart_processing(data)
      x_data = data['x_data']
      y_data = data['y_data']

      ref_model = x_data['attribute'][0..-4]
      sub_attribute = x_data['sub_attribute']

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}
      labels = x_data['labels-corres'].empty? ? x_data['labels'] : x_data['labels-corres']

      x_data['labels'].each do |l|
        0.upto(y_data.length-1).each do |i|
          split = l.split('-')
          low = l[-1] == '+' ? l[0..-2] : split[0]
          high = split.length == 2 ? split[1] : low

          if l[-1] == '+'
            data = y_data[i].joins(:"#{ref_model}").where("#{ref_model.pluralize}.#{sub_attribute} >= ?", low)
          else
            data = y_data[i].joins(:"#{ref_model}").where("#{ref_model.pluralize}.#{sub_attribute}": low..high)
          end

          datasets[i].push(data.count)
        end
      end

      {labels: labels, datasets: datasets}
    end

    def boolean_chart_processing(data)
      x_data = data['x_data']
      y_data = data['y_data']

      attribute = x_data['attribute']

      sub_attribute = x_data['sub_attribute']
      unless sub_attribute.nil?
        return sub_has_boolean_chart_processing(data) if x_data['sub_attribute_from'] == 'has'
        return sub_ref_boolean_chart_processing(data)
      end

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}
      labels = x_data['labels-corres'].empty? ? x_data['labels'] : x_data['labels-corres']

      x_data['labels'].each do |l|
        0.upto(y_data.length-1).each do |i|
          data = y_data[i].where("#{attribute}": true_string?(l))

          datasets[i].push(data.count)
        end
      end

      {labels: labels, datasets: datasets}
    end

    def sub_has_boolean_chart_processing(data)
      x_data = data['x_data']
      y_data = data['y_data']

      has_models = x_data['attribute'].pluralize
      model_string = y_data.first.first.class.name.underscore
      sub_attribute = x_data['sub_attribute']

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}
      labels = x_data['labels-corres'].empty? ? x_data['labels'] : x_data['labels-corres']

      x_data['labels'].each do |l|
        0.upto(y_data.length-1).each do |i|
          data = y_data[i].joins("LEFT JOIN #{has_models} ON #{has_models}.#{model_string}_id = #{model_string.pluralize}.id")
                     .group("#{model_string.pluralize}.id, #{has_models}.#{sub_attribute}")
                     .having("#{has_models}.#{sub_attribute}": true_string?(l))

          sum = 0
          data.count.each { |key, count| sum += count }
          datasets[i].push(sum)
        end
      end

      {labels: labels, datasets: datasets}
    end

    def sub_ref_boolean_chart_processing(data)
      x_data = data['x_data']
      y_data = data['y_data']

      ref_model = x_data['attribute'][0..-4]
      sub_attribute = x_data['sub_attribute']

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}
      labels = x_data['labels-corres'].empty? ? x_data['labels'] : x_data['labels-corres']

      x_data['labels'].each do |l|
        0.upto(y_data.length-1).each do |i|
          data = y_data[i].joins(:"#{ref_model}").where("#{ref_model.pluralize}.#{sub_attribute}": true_string?(l))

          datasets[i].push(data.count)
        end
      end

      {labels: labels, datasets: datasets}
    end

    def text_chart_processing(data)
      x_data = data['x_data']
      y_data = data['y_data']

      sub_attribute = x_data['sub_attribute']
      unless sub_attribute.nil?
        return sub_has_text_chart_processing(data) if x_data['sub_attribute_from'] == 'has'
        return sub_ref_text_chart_processing(data)
      end

      attribute = x_data['attribute']

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}

      labels = get_or_pluck_labels(x_data, y_data)

      labels.each do |l|
        0.upto(y_data.length-1).each do |i|
          datasets[i].push(y_data[i].where("#{attribute}": l).count)
        end
      end

      {labels: labels, datasets: datasets}
    end

    def sub_has_text_chart_processing(data)
      x_data = data['x_data']
      y_data = data['y_data']

      has_models = x_data['attribute'].pluralize
      model_string = y_data.first.first.class.name.underscore
      sub_attribute = x_data['sub_attribute']

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}

      labels = get_or_pluck_labels(x_data, y_data)

      labels.each do |l|
        0.upto(y_data.length-1).each do |i|
          data = y_data[i].joins("LEFT JOIN #{has_models} ON #{has_models}.#{model_string}_id = #{model_string.pluralize}.id")
                     .group("#{model_string.pluralize}.id, #{has_models}.#{sub_attribute}")
                     .having("#{has_models}.#{sub_attribute} = #{l}")
          sum = 0
          data.count.each { |key, count| sum += count }
          datasets[i].push(sum)
        end
      end

      {labels: labels, datasets: datasets}
    end

    def sub_ref_text_chart_processing(data)
      x_data = data['x_data']
      y_data = data['y_data']

      ref_model = x_data['attribute'][0..-4]
      sub_attribute = x_data['sub_attribute']

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}

      labels = get_or_pluck_labels(x_data, y_data)

      labels.each do |l|
        0.upto(y_data.length-1).each do |i|
          datasets[i].push(y_data[i].joins(:"#{ref_model}").where("#{ref_model.pluralize}.#{sub_attribute} = '#{l}'").count)
        end
      end

      {labels: labels, datasets: datasets}
    end

    # Has is necessarily a count : if a sub-attribute is given, then label_type becomes the one of the sub attribute and cannot be has
    def has_model_chart_processing(data)
      x_data = data['x_data']
      y_data = data['y_data']

      has_models = x_data['attribute'].pluralize
      model_string = y_data.first.first.class.name.underscore

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}

      labels = x_data['labels']
      labels.each do |l|
        0.upto(y_data.length-1).each do |i|
          split = l.split('-')
          low = l[-1] == '+' ? l[0..-2] : split[0]
          high = split.length == 2 ? split[1] : low

          if l[-1] == '+'
            data = y_data[i].joins("LEFT JOIN #{has_models} ON #{has_models}.#{model_string}_id = #{model_string.pluralize}.id")
                       .group("#{model_string.pluralize}.id")
                       .having("count(#{has_models}.id) >= ?", low)
          else
            data = y_data[i].joins("LEFT JOIN #{has_models} ON #{has_models}.#{model_string}_id = #{model_string.pluralize}.id")
                       .group("#{model_string.pluralize}.id")
                       .having("count(#{has_models}.id) BETWEEN ? AND ?", low, high)
          end

          sum = 0
          data.count.each { |key, count| sum += count }
          datasets[i].push(sum)
        end
      end

      {labels: labels, datasets: datasets}
    end

    def ref_model_chart_processing(data)
      x_data = data['x_data']
      y_data = data['y_data']

      ref_model = x_data['attribute']

      datasets = []
      0.upto(y_data.length-1).each {datasets.push([])}

      labels = ['Having', 'Not having']
      0.upto(y_data.length-1).each do |i|
        tot_count = y_data[i].count
        having_count = y_data[i].where.not("#{ref_model}": nil).count
        datasets[0].push(having_count).push(tot_count - having_count)
      end

      {labels: labels, datasets: datasets}
    end


    # Returns the date group size regarding date_info
    def date_label_group_size(date_info)
      case date_info['period']
        when 'day'
          1
        when 'week'
          7
        else
          30
      end
    end

    def get_date_labels(date_info)
      limit_dates = get_start_and_end_dates(date_info)
      start_date = limit_dates[0]
      end_date = limit_dates[1]
      period_length = (end_date - start_date).to_i
      group_size = date_label_group_size(date_info)

      labels = []
      (0..(period_length-1)).step(group_size).each do |i|
        date = (start_date + i.days)
        labels.push(date)
      end
      labels
    end

    def get_or_pluck_labels(x_data, y_data)
      case x_data['label_type']
        when 'text-auto'
          sub_attribute = x_data['sub_attribute']
          pluck_from = sub_attribute.nil? ? y_data.first : x_data['attribute'][0..-4].classify.safe_constantize
          to_pluck = sub_attribute.nil? ? x_data['attribute'] : sub_attribute

          labels = pluck_from.pluck(:"#{to_pluck}").uniq

        when 'text'
          labels = x_data['labels']
      end
      labels
    end

    include FilterHelper
    def chart_processed_data_from_redis(chart_data)
      redis_data = nil
      style = chart_data.delete('style')
      unless chart_data['refresh'] == 'true' || DashCreator.redis_store_variable.nil?
        redis_chart_data = encode_chart_data(chart_data)
        redis_data = DashCreator.redis_store_variable.get(redis_chart_data)
      end

      unless redis_data.nil?
        processed_data = JSON.parse(redis_data)
      else
        chart_data_with_records = prepare_data(chart_data)
        processed_data = chart_processing(chart_data_with_records).deep_stringify_keys
        processed_data['last_updated'] = DateTime.now.strftime('%d/%m/%Y - %T')

        # Add chart data to redis
        DashCreator.redis_store_variable[redis_chart_data] = processed_data.to_json unless DashCreator.redis_store_variable.nil?
      end

      processed_data['style'] = style
      processed_data['style'] = processed_data['style'].to_unsafe_h unless processed_data['style'].is_a?(Hash)

      processed_data
    end

    def encode_chart_data(chart_data)
      # Prepare data to encode
      encoded_chart_data = chart_data.clone
      encoded_chart_data = encoded_chart_data.to_unsafe_h unless encoded_chart_data.is_a?(Hash)
      encoded_chart_data.delete('style')
      encoded_chart_data.delete('controller')
      encoded_chart_data.delete('action')
      encoded_chart_data.delete('refresh')

      # Encode
      hash_hash(encoded_chart_data)
    end

    # This helper function is used in create_chart.js.erb to hash param hash to store it in Redis
    def hash_hash(h)
      require 'digest/sha1'
      str = recursive_flatten(h).sort.join
      Digest::SHA1.hexdigest(str)
    end

    def recursive_flatten(h)
      h.flatten(-1).map{|el| el.is_a?(Hash) ? recursive_flatten(el) : el}.flatten
    end
  end
end
