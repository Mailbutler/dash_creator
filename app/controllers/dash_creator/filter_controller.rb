require_dependency "dash_creator/application_controller"

module DashCreator
  class FilterController < ApplicationController
    skip_before_action :verify_authenticity_token

    def get_filter
      user = user_for_dash_creator
      filter = DashCreator::Filter.all.where(user_id: user.id).find(params[:filter_id])

      render json: filter.options
    end

    def save_filter
      user = user_for_dash_creator
      filter = DashCreator::Filter.all.where(user_id: user.id).create(name: params[:filter_name], options: params[:filters])

      render json: {filter_id: filter.id}
    end

    def delete_filters
      user = user_for_dash_creator
      DashCreator::Filter.all.where(user_id: user.id, id: params[:filters_ids]).destroy_all
    end

    def filtering_result
      return render json: {models: nil} if params[:filters].nil?

      render 'dash_creator/filter/apply_filtering', locals: {data: params['filters']}
    end

    def download_csv
      model = params[:model]
      columns = params[:columns]
      objects = model.safe_constantize.find(params[:ids])

      file = CSV.generate do |csv|
        csv << columns
        objects.each do |o|
          csv << o.attributes.values_at(*columns)
        end
      end

      send_data file,
                type: 'text/csv; charset=utf-8; header=present',
                disposition: "attachment; filename=#{model}.csv"
    end

    def create_stat
      id = params[:filter_id]
      filters_data = DashCreator::Filter.find(id).options

      render 'dash_creator/filter/create_stat', locals: {filters_data: filters_data, id: id}
    end
  end
end
