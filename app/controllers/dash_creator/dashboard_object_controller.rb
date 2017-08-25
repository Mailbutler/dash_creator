require_dependency "dash_creator/application_controller"

module DashCreator
  class DashboardObjectController < ApplicationController
    skip_before_action :verify_authenticity_token

    def get_model_objects
      object = DashboardObject.find_by_code(params['object_code'])

      model_objects = object.info['model_name'].classify.safe_constantize.all

      model_objects_json = model_objects.map{ |o| {id: o.id, name: o.name} }

      render json: {model_objects: model_objects_json}
    end

    def save_object
      object = DashboardObject.create(name: params[:name], options: params[:options])

      render json: {object_id: object.id}
    end

    def edit_object
      object = DashboardObject.find_by_code(params['object_code'])
      object.update_attribute(:options, params[:options])

      render json: {object_id: object.id}
    end

    def delete_object
      DashboardObject.find(params[:object_id]).destroy
    end
  end
end
