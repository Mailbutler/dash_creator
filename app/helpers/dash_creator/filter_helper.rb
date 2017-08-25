module DashCreator
  module FilterHelper
    def filter_data(data)
      Rails.application.eager_load!
      models = ApplicationRecord.descendants

      mods = {}
      data.keys.each do |k|
        model = models.select { |m| m.name == k }[0]
        filter_hash = data[k]

        mods[k] = filter_model(model, filter_hash)
      end

      mods
    end

    def prepare_data(params)
      mods = filter_data(params['filters'])

      data = params

      data['y_data'] = data['y_data'].map { |d| mods[d] }

      x_model_data = mods[data['x_data']['attribute']]
      data['x_data'] = x_model_data unless x_model_data.nil?

      data
    end

    # Query on model with data from filter_hash
    def filter_model(model, filter_hash)
      mods = model.all
      # For each key of the model, recursively query (attributes, submodels)
      filter_hash.keys.each do |k|
        next if k == 'num_records'
        attribute = k.split('_').last == 'id' ? k[0..-4] : k
        mods = recursive_filter_attribute(mods, attribute, filter_hash[k])
      end
      return nil if mods.nil?

      # Limit results if num_records is given
      limit = filter_hash['num_records']
      return mods.limit(limit.to_i) unless limit.empty?
      mods
    end

    # Recursively query attributes depending on type associated to hash
    def recursive_filter_attribute(models, attribute, filter_hash)
      return nil if models.nil? || models.empty?

      case filter_hash['type']
        when 'datetime'
          mods = filter_datetime(models, attribute, filter_hash)

        when 'text'
          mods = filter_text(models, attribute, filter_hash)

        when 'numeric'
          mods = filter_numeric(models, attribute, filter_hash)

        when 'boolean'
          mods = filter_boolean(models, attribute, filter_hash)

        when 'has'
          mods = filter_has(models, attribute, filter_hash)

        when 'ref'
          mods = filter_ref(models, attribute, filter_hash)

        else
          raise ArgumentError, 'type_' + filter_hash['type'] + '_is_unknown'
      end
      mods
    end

    # Helper functions for each type
    # Query on models for attribute according to data in filter_hash

    def filter_datetime(models, attribute, filter_hash)
      mods = models
      model_string = models.first.class.name.underscore
      query_attribute = model_string.pluralize + '.' + attribute
      start_date = DateTime.strptime(filter_hash['start'], '%b %d, %Y').beginning_of_day
      end_date = DateTime.strptime(filter_hash['end'], '%b %d, %Y').beginning_of_day + 1.days
      mods = mods.where("#{query_attribute}": start_date..end_date) if filter_hash.key?('start')
      mods
    end

    def filter_text(models, attribute, filter_hash)
      return models unless filter_hash.key?('present')
      mods = models

      model_string = models.first.class.name.underscore
      query_attribute = model_string.pluralize + '.' + attribute

      if !true_string?(filter_hash['present'])
        mods = mods.where("#{attribute}": [nil, ''])
      else
        if filter_hash.key?('contains')
          mods = mods.where(query_attribute + ' ~* ?', filter_hash['contains'])
        else
          mods = mods.where.not("#{attribute}": [nil, ''])
        end
      end
      mods
    end

    def filter_numeric(models, attribute, filter_hash)
      return models unless filter_hash.key?('value')

      mods = models.where("#{attribute}": filter_hash['value'].to_i)
      mods
    end

    def filter_boolean(models, attribute, filter_hash)
      return models unless filter_hash.key?('value')

      mods = models.where("#{attribute}": true_string?(filter_hash['value']))
      mods
    end

    def filter_has(models, attribute, filter_hash)
      return models unless filter_hash.key?('has')
      mods = models

      has_models = attribute.pluralize
      model_string = models.first.class.name.underscore

      if true_string?(filter_hash['has'])
        mods = mods.includes("#{has_models}")
                   .where.not("#{has_models}": {"#{model_string}_id": nil})

        mods = mods.joins("LEFT JOIN #{has_models} ON #{has_models}.#{model_string}_id = #{model_string.pluralize}.id")
                   .group("#{model_string.pluralize}.id")
                   .having("count(#{has_models}.id) >= ?", filter_hash['has-inf'].to_i) if filter_hash.key?('has-inf')
        mods = mods.joins("LEFT JOIN #{has_models} ON #{has_models}.#{model_string}_id = #{model_string.pluralize}.id")
                   .group("#{model_string.pluralize}.id")
                   .having("count(#{has_models}.id) <= ?", filter_hash['has-sup'].to_i) if filter_hash.key?('has-sup')
        return nil if mods.nil?

        # Go recursively through has model params
        attribute_models = attribute.classify.safe_constantize.where("#{model_string}": mods)
        main_keys = %w[has-sup has-inf has type]
        filter_hash.keys.each do |k|
          attribute_models = recursive_filter_attribute(attribute_models, k.underscore, filter_hash[k]) unless main_keys.include?(k)
        end
        return nil if attribute_models.nil?
        mods_ids = []
        attribute_models.each { |m| mods_ids.push(m[model_string + '_id']) }
        mods = mods.where(id: mods_ids)
      else
        mods = mods.includes(:"#{has_models}")
                   .where("#{has_models}": {"#{model_string}_id": nil})
      end
      mods
    end

    def filter_ref(models, attribute, filter_hash)
      return models unless filter_hash.key?('ref')
      mods = models

      if true_string?(filter_hash['ref'])
        mods = mods.where.not("#{attribute}": nil)
        return nil if mods.nil?

        # Go recursively through ref model params
        attributes_ids = []
        mods.each { |m| attributes_ids.push(m[attribute + '_id']) }
        attribute_models = attribute.classify.safe_constantize
                               .where(id: attributes_ids)
        main_keys = %w[ref type]
        filter_hash.keys.each do |k|
          attribute_models = recursive_filter_attribute(attribute_models, k.underscore, filter_hash[k]) unless main_keys.include?(k)
        end
        mods = mods.where("#{attribute}": attribute_models)
      else
        mods = mods.where("#{attribute}": nil)
      end
      mods
    end

    # Check if string is 'true'
    def true_string?(string)
      string == 'true'
    end

    def get_csv(models)
      CSV.generate do |csv|
        columns = models.first.keys.map { |k| k.to_s }
        csv << columns
        models.each do |m|
          csv << m.attributes.values_at(*columns)
        end
      end
    end
  end
end
