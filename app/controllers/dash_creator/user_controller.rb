require_dependency "dash_creator/application_controller"

module DashCreator
  class UserController < ApplicationController
    ##### Creator for filters, charts & dashboards #####

    def creator
      user = user_for_dash_creator

      Rails.application.eager_load!
      models = ApplicationRecord.descendants.select{ |m| !DashCreator.except_models.include?(m.name) }

      @models = models.map{ |m| [m.name, m.name] }

      @filters = DashCreator::Filter.where(user_id: user.id).all.map { |f| [f.name, f.id] }
      @models_data = models_data
      @charts = DashCreator::Chart.where(user_id: user.id).all.map { |c| [c.name, c.id] }
      @dashboards = DashCreator::Dashboard.where(user_id: user.id).all.map { |d| [d.name, d.id] }

      @dashboard_objects = DashboardObject.all
      @model_objects = {}
      @dashboard_objects.each do |o|
        if o.info['model_name'] != ''
          model = o.info['model_name'].safe_constantize
          model_objects = (model.column_names.include? 'user_id') ? model.where(user: user) : model.all
          @model_objects[o.code] = model_objects.map{ |mo| {id: mo.id, name: mo.name} }
        end
      end

      render :creator, layout: DashCreator.layout_path
    end


    ##### Render a dashboard #####

    def dashboard
      user = user_for_dash_creator
      @dashboard = DashCreator::Dashboard.where(user_id: user.id).find(params[:dashboard_id])
      @dashboards = DashCreator::Dashboard.where(user_id: user.id).all.map { |d| [d.name, d.id] }

      render :dashboard, layout: DashCreator.layout_path
    end


    private
    def models_data
      Rails.application.eager_load!
      models = ApplicationRecord.descendants.select{ |m| !DashCreator.except_models.include?(m.name.gsub('::', '')) }

      numeric_types = Numeric.descendants.map{ |n| n.name.underscore }

      models_data = {}
      models.each do |m|
        belongs_to_models = m.reflect_on_all_associations(:belongs_to)
                                .map(&:name)
                                .map{ |x| x.to_s << '_id' }
                                .map{ |x| DashCreator.columns_aliases[x].nil? ? x : DashCreator.columns_aliases[x] }

        models_data[m.name] = []
        m.columns_hash.each do |k,v|
          if belongs_to_models.include?(k)
            models_data[m.name].push(k + '-ref')
          else
            type = v.type.to_s
            type = 'numeric' if numeric_types.include?(type)
            type = 'text' if type == 'string'
            type = 'datetime' if type == 'date'
            models_data[m.name].push(k + '-' + type) unless DashCreator.except_attributes.include?(k)
          end
        end

        has_many_models = m.reflect_on_all_associations(:has_many)
                              .map(&:name)
                              .map{ |x| x.to_s }
                              .select{ |k| !DashCreator.except_models.include?(k.classify) }
        has_many_models.each { |h| models_data[m.name].push(h.singularize + '-has') }
      end

      models_data
    end
  end
end
